import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { prisma, NETWORKS, ChainId, FLASH_LOAN_PROVIDERS } from '@flashloan/shared';

// Load environment variables
dotenv.config({ path: '../../.env' });

const SCAN_INTERVAL_MS = parseInt(process.env.SCAN_INTERVAL_MS || '5000', 10);
const DEFAULT_CHAIN = 'arbitrum'; // Use Arbitrum by default due to high DEX density

// Minimal ABIs
const UNISWAP_V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];
const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationQueueDelta, uint16 observationQueueNext, bool boolean, uint16 feeProtocol)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];
const UNISWAP_V2_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];
const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

interface PoolCache {
  address: string;
  dexName: string;
  version: 2 | 3;
  fee: number;
  token0: string;
  token1: string;
  contract: ethers.Contract;
}

class PriceScanner {
  private provider!: ethers.JsonRpcProvider;
  private chainName: string;
  private networkConfig: any;
  private pools: PoolCache[] = [];
  private isScanning = false;

  constructor(chainName: string = DEFAULT_CHAIN) {
    this.chainName = chainName;
    this.networkConfig = NETWORKS[chainName];
    if (!this.networkConfig) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }
  }

  async init() {
    console.log(`[Scanner] Initializing for chain: ${this.networkConfig.name}...`);
    this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);

    // Optional wallet signer verification (safe for paper trading)
    const privateKey = process.env.EXECUTOR_PRIVATE_KEY;
    if (privateKey) {
      try {
        const wallet = new ethers.Wallet(privateKey, this.provider);
        console.log(`[Scanner] Wallet signer loaded: ${wallet.address}`);
      } catch (err: any) {
        console.warn(`[Scanner] Failed to load wallet signer:`, err.message);
      }
    }

    // Bootstrap local pool configurations in DB if not exists
    await this.bootstrapPoolConfigs();

    // Cache the active pools
    const activePools = await prisma.poolConfig.findMany({
      where: { chain: this.chainName, active: true }
    });

    for (const pool of activePools) {
      const isV3 = pool.dex === 'UniswapV3';
      // Normalize to valid EIP-55 checksum — ethers v6 is strict about this
      const checksumAddress = ethers.getAddress(pool.address.toLowerCase());
      const contract = new ethers.Contract(
        checksumAddress,
        isV3 ? UNISWAP_V3_POOL_ABI : UNISWAP_V2_PAIR_ABI,
        this.provider
      );
      this.pools.push({
        address: checksumAddress,
        dexName: pool.dex,
        version: isV3 ? 3 : 2,
        fee: pool.fee,
        token0: pool.token0,
        token1: pool.token1,
        contract
      });
    }

    console.log(`[Scanner] Cached ${this.pools.length} pools for price lookups.`);
  }

  // Pre-seed some standard pools for Arbitrum if database is empty
  private async bootstrapPoolConfigs() {
    const poolCount = await prisma.poolConfig.count({
      where: { chain: this.chainName }
    });

    if (poolCount > 0) return;

    console.log(`[Scanner] Bootstrapping default pools in database for ${this.chainName}...`);

    // Default pools on Arbitrum
    // All addresses are normalised via ethers.getAddress() to ensure valid
    // EIP-55 checksums — ethers v6 rejects addresses with wrong capitalisation.
    const normalize = (addr: string) => ethers.getAddress(addr.toLowerCase());

    const defaultPools = [
      // Uniswap V3 Pools on Arbitrum
      {
        chain: 'arbitrum',
        dex: 'UniswapV3',
        address: normalize('0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'), // WETH/USDC 0.05%
        token0: 'WETH',
        token1: 'USDC',
        fee: 500,
        active: true
      },
      {
        chain: 'arbitrum',
        dex: 'UniswapV3',
        address: normalize('0x502F6b92DAf04F1746B316C4b2bFAf05bCc88e7A'), // USDC/DAI 0.01%
        token0: 'USDC',
        token1: 'DAI',
        fee: 100,
        active: true
      },
      {
        chain: 'arbitrum',
        dex: 'UniswapV3',
        address: normalize('0xa96028598D9F2C9c34E4c382a0b793B72200000b'), // DAI/WETH 0.05%
        token0: 'DAI',
        token1: 'WETH',
        fee: 500,
        active: true
      },
      {
        chain: 'arbitrum',
        dex: 'UniswapV3',
        address: normalize('0x17c14D2c404373577d2777E5db5869E4bbA4B4B9'), // WETH/USDT 0.05%
        token0: 'WETH',
        token1: 'USDT',
        fee: 500,
        active: true
      },
      {
        chain: 'arbitrum',
        dex: 'UniswapV3',
        address: normalize('0xbe3ded8658245597e1239f8efa507858c54a99ec'), // USDT/USDC 0.01%
        token0: 'USDT',
        token1: 'USDC',
        fee: 100,
        active: true
      }
    ];

    for (const pool of defaultPools) {
      await prisma.poolConfig.create({
        data: pool
      });
    }
  }

  async start() {
    console.log(`[Scanner] Starting scan loop every ${SCAN_INTERVAL_MS}ms.`);
    setInterval(async () => {
      if (this.isScanning) return;
      this.isScanning = true;
      try {
        await this.scan();
      } catch (error) {
        console.error('[Scanner] Error in scan loop:', error);
      } finally {
        this.isScanning = false;
      }
    }, SCAN_INTERVAL_MS);
  }

  private async scan() {
    console.log(`[Scanner] Scanning prices on ${this.networkConfig.name}...`);

    // Retrieve active settings
    const settings = await prisma.botSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        minProfitThreshold: parseFloat(process.env.MIN_PROFIT_THRESHOLD_USD || '10.0'),
        slippageTolerance: 0.5,
        gasMultiplier: 1.1,
        paperTrading: process.env.PAPER_TRADING === 'true',
        activeChains: 'arbitrum'
      }
    });

    // 1. Fetch pool states concurrently
    const states: { [address: string]: any } = {};
    await Promise.all(
      this.pools.map(async (pool) => {
        try {
          if (pool.version === 3) {
            const slot = await pool.contract.slot0();
            states[pool.address] = {
              sqrtPriceX96: slot.sqrtPriceX96.toString()
            };
          } else {
            const reserves = await pool.contract.getReserves();
            states[pool.address] = {
              reserve0: reserves.reserve0.toString(),
              reserve1: reserves.reserve1.toString()
            };
          }
        } catch (err) {
          console.error(`[Scanner] Failed to fetch state for pool ${pool.address}:`, err);
        }
      })
    );

    // 2. Fetch current Gas Price
    let gasPrice = 200000000n; // fallback 0.2 gwei for Arbitrum
    try {
      const feeData = await this.provider.getFeeData();
      if (feeData.gasPrice) {
        gasPrice = feeData.gasPrice;
      }
    } catch (err) {
      console.warn('[Scanner] Failed to fetch gas price, using default.');
    }

    // 3. Define Triangular Routes (WETH -> USDC -> DAI -> WETH)
    // We will simulate swapping 1 WETH through the pools
    const routes = [
      {
        path: ['WETH', 'USDC', 'DAI', 'WETH'],
        pools: [
          this.getPoolForPair('WETH', 'USDC'),
          this.getPoolForPair('USDC', 'DAI'),
          this.getPoolForPair('DAI', 'WETH')
        ]
      },
      {
        path: ['WETH', 'USDT', 'USDC', 'WETH'],
        pools: [
          this.getPoolForPair('WETH', 'USDT'),
          this.getPoolForPair('USDT', 'USDC'),
          this.getPoolForPair('WETH', 'USDC') // reverse swap
        ]
      }
    ];

    const wethPriceInUsd = await this.getTokenPriceInUsd('WETH', states);

    for (const route of routes) {
      if (route.pools.some(p => !p || !states[p.address])) {
        continue;
      }

      const inputAmount = 1.0; // 1 WETH
      let currentAmount = inputAmount;

      for (let i = 0; i < route.path.length - 1; i++) {
        const fromToken = route.path[i];
        const toToken = route.path[i+1];
        const pool = route.pools[i]!;

        currentAmount = this.calculateSwapOutput(
          fromToken,
          toToken,
          currentAmount,
          pool,
          states[pool.address]
        );
      }

      const grossProfitTokens = currentAmount - inputAmount;
      const grossProfitUsd = grossProfitTokens * wethPriceInUsd;

      // Estimate Gas (roughly 280,000 gas for triangular Uniswap V3 swap)
      const estimatedGasLimit = 280000n;
      const totalGasCostWei = estimatedGasLimit * gasPrice;
      const totalGasCostEth = parseFloat(ethers.formatEther(totalGasCostWei));
      const gasCostUsd = totalGasCostEth * wethPriceInUsd;

      const netProfitUsd = grossProfitUsd - gasCostUsd;

      console.log(
        `[Route] ${route.path.join(' -> ')} | Out: ${currentAmount.toFixed(6)} WETH | Gross: $${grossProfitUsd.toFixed(4)} | Gas: $${gasCostUsd.toFixed(4)} | Net: $${netProfitUsd.toFixed(4)}`
      );

      // Log opportunity if profitable or interesting
      if (netProfitUsd > -5.0) { // Log all slightly-negative or profitable for analytics
        await prisma.opportunity.create({
          data: {
            chain: this.chainName,
            route: route.path.join(' -> '),
            grossProfit: grossProfitUsd,
            gasCost: gasCostUsd,
            netProfit: netProfitUsd,
            status: netProfitUsd >= settings.minProfitThreshold ? 'DETECTED' : 'SIMULATED',
            details: {
              inputAmount,
              outputAmount: currentAmount,
              gasPrice: gasPrice.toString(),
              timestamp: Date.now()
            }
          }
        });
      }
    }
  }

  private getPoolForPair(tokenA: string, tokenB: string): PoolCache | undefined {
    return this.pools.find(
      (p) =>
        (p.token0 === tokenA && p.token1 === tokenB) ||
        (p.token0 === tokenB && p.token1 === tokenA)
    );
  }

  private async getTokenPriceInUsd(symbol: string, states: any): Promise<number> {
    if (symbol === 'USDC' || symbol === 'USDT') return 1.0;
    if (symbol === 'DAI') return 1.0;

    // Estimate WETH price from WETH/USDC pool
    const pool = this.getPoolForPair('WETH', 'USDC');
    if (!pool || !states[pool.address]) return 3200.0; // fallback

    const state = states[pool.address];
    return this.calculateUniswapV3Price(pool, state, 'WETH', 'USDC');
  }

  private calculateSwapOutput(
    from: string,
    to: string,
    amountIn: number,
    pool: PoolCache,
    state: any
  ): number {
    if (pool.version === 3) {
      // V3 Pool quote
      const token0PriceInToken1 = this.calculateUniswapV3Price(pool, state, pool.token0, pool.token1);
      
      const isFromToken0 = pool.token0 === from;
      const feeMultiplier = 1 - (pool.fee / 1000000); // e.g. 500 = 0.05% fee

      if (isFromToken0) {
        return amountIn * token0PriceInToken1 * feeMultiplier;
      } else {
        return (amountIn / token0PriceInToken1) * feeMultiplier;
      }
    } else {
      // V2 constant product formula
      const reserve0 = parseFloat(state.reserve0);
      const reserve1 = parseFloat(state.reserve1);
      
      const fromDecimals = this.networkConfig.tokens[from].decimals;
      const toDecimals = this.networkConfig.tokens[to].decimals;
      
      const isFromToken0 = pool.token0 === from;
      const rIn = isFromToken0 ? reserve0 : reserve1;
      const rOut = isFromToken0 ? reserve1 : reserve0;

      // Adjust reserves for decimal differences
      const adjustedRIn = rIn / (10 ** fromDecimals);
      const adjustedROut = rOut / (10 ** toDecimals);

      // 0.3% fee for V2 pools
      const amountInWithFee = amountIn * 0.997;
      const amountOut = (amountInWithFee * adjustedROut) / (adjustedRIn + amountInWithFee);
      return amountOut;
    }
  }

  private calculateUniswapV3Price(
    pool: PoolCache,
    state: any,
    baseToken: string,
    quoteToken: string
  ): number {
    const sqrtPriceX96 = BigInt(state.sqrtPriceX96);
    
    // Price = (sqrtPriceX96 / 2^96)^2
    const ratio = Number(sqrtPriceX96) / Math.pow(2, 96);
    const rawPrice = ratio * ratio;

    const token0Decimals = this.networkConfig.tokens[pool.token0].decimals;
    const token1Decimals = this.networkConfig.tokens[pool.token1].decimals;

    // Price of Token0 in terms of Token1
    const token0PriceInToken1 = rawPrice * Math.pow(10, token0Decimals - token1Decimals);

    if (baseToken === pool.token0 && quoteToken === pool.token1) {
      return token0PriceInToken1;
    } else {
      return 1 / token0PriceInToken1;
    }
  }
}

// Start scanner
const scanner = new PriceScanner();
scanner.init().then(() => scanner.start()).catch(console.error);

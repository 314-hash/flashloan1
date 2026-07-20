import { PrismaClient } from '@prisma/client';

// Instantiate and export global Prisma Client
export const prisma = new PrismaClient();

// Chain IDs
export enum ChainId {
  MAINNET = 1,
  POLYGON = 137,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  BASE = 8453
}

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

export interface DexConfig {
  name: string;
  factory: string;
  quoter?: string; // Optional for Uniswap V3
  router?: string; // Optional for Uniswap V2
  version: 2 | 3;
}

export interface NetworkConfig {
  id: ChainId;
  name: string;
  rpcUrl: string;
  nativeToken: string;
  tokens: { [symbol: string]: TokenConfig };
  dexs: { [name: string]: DexConfig };
}

// Global configurations for all supported networks
export const NETWORKS: { [key: string]: NetworkConfig } = {
  ethereum: {
    id: ChainId.MAINNET,
    name: 'Ethereum',
    rpcUrl: process.env.RPC_ETH || 'https://cloudflare-eth.com',
    nativeToken: 'ETH',
    tokens: {
      WETH: { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
      USDC: { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0CE3606eB48', decimals: 6 },
      DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
      USDT: { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }
    },
    dexs: {
      UniswapV3: {
        name: 'UniswapV3',
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        version: 3
      },
      SushiSwapV2: {
        name: 'SushiSwapV2',
        factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
        router: '0xd9e1c13d5b03f1c505d1c5d2884146a47a1ff6c7',
        version: 2
      }
    }
  },
  arbitrum: {
    id: ChainId.ARBITRUM,
    name: 'Arbitrum One',
    rpcUrl: process.env.RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
    nativeToken: 'ETH',
    tokens: {
      WETH: { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f352415231aa11', decimals: 18 },
      USDC: { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
      DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0e473a64756A5FD12405261a', decimals: 18 },
      USDT: { symbol: 'USDT', name: 'Tether USD', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 }
    },
    dexs: {
      UniswapV3: {
        name: 'UniswapV3',
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        version: 3
      },
      SushiSwapV2: {
        name: 'SushiSwapV2',
        factory: '0xc35D6228f656E14c375c287D9e68786270557497',
        router: '0x1b02da8cb03097b65563a868c9bc3590c97aba41',
        version: 2
      }
    }
  },
  polygon: {
    id: ChainId.POLYGON,
    name: 'Polygon',
    rpcUrl: process.env.RPC_POLYGON || 'https://polygon-rpc.com',
    nativeToken: 'POL',
    tokens: {
      WMATIC: { symbol: 'WMATIC', name: 'Wrapped Matic', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
      USDC: { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
      DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 },
      USDT: { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 }
    },
    dexs: {
      UniswapV3: {
        name: 'UniswapV3',
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        version: 3
      },
      QuickSwapV2: {
        name: 'QuickSwapV2',
        factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
        router: '0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff',
        version: 2
      }
    }
  },
  base: {
    id: ChainId.BASE,
    name: 'Base',
    rpcUrl: process.env.RPC_BASE || 'https://mainnet.base.org',
    nativeToken: 'ETH',
    tokens: {
      WETH: { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
      USDC: { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
      DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x50c5725949A6F0c72E6C4a641F24049A91D18C41', decimals: 18 }
    },
    dexs: {
      UniswapV3: {
        name: 'UniswapV3',
        factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
        quoter: '0x3Cbf16A7d8d1C07C748e0d0B194da98A367a74Fd',
        version: 3
      }
    }
  },
  optimism: {
    id: ChainId.OPTIMISM,
    name: 'Optimism',
    rpcUrl: process.env.RPC_OPTIMISM || 'https://mainnet.optimism.io',
    nativeToken: 'ETH',
    tokens: {
      WETH: { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18 },
      USDC: { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9d7837CAf62653d097Ff85', decimals: 6 },
      DAI: { symbol: 'DAI', name: 'Dai Stablecoin', address: '0xDA10009cBd5D07dd0e473a64756A5FD12405261a', decimals: 18 }
    },
    dexs: {
      UniswapV3: {
        name: 'UniswapV3',
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        version: 3
      }
    }
  }
};

// Standard Flash Loan Providers config
export interface FlashLoanProvider {
  name: string;
  address: string;
  feePercent: number; // e.g. 0.09 for Aave (0.09%)
}

export const FLASH_LOAN_PROVIDERS: { [key: string]: { [provider: string]: FlashLoanProvider } } = {
  ethereum: {
    AaveV3: { name: 'Aave V3', address: '0x87870Bca3F124E1a70794d2410a7a4025cca33b1', feePercent: 0.09 },
    Balancer: { name: 'Balancer', address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', feePercent: 0.0 }
  },
  arbitrum: {
    AaveV3: { name: 'Aave V3', address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', feePercent: 0.09 },
    Balancer: { name: 'Balancer', address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', feePercent: 0.0 }
  }
};

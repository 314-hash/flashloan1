# 🏛️ Architecture — FlashLoan AI

> **Audience:** Developers, architects, and contributors wanting to understand the system design.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Diagram](#2-component-diagram)
3. [Data Flow](#3-data-flow)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)
6. [Price Scanner Design](#6-price-scanner-design)
7. [API Server Design](#7-api-server-design)
8. [Dashboard Design](#8-dashboard-design)
9. [Shared Package](#9-shared-package)
10. [Security Model](#10-security-model)
11. [Future Roadmap](#11-future-roadmap)

---

## 1. System Overview

FlashLoan AI is a **monorepo** built with npm workspaces. It consists of three runtime services and one shared library:

```
┌───────────────────────────────────────────────────────────────────┐
│                         FLASHLOAN AI PLATFORM                     │
│                                                                   │
│  ┌─────────────────┐     ┌──────────────────┐                    │
│  │  Price Scanner  │────▶│    PostgreSQL     │                    │
│  │  (bots/scanner) │     │  (Docker/cloud)  │                    │
│  └─────────────────┘     └────────┬─────────┘                    │
│           │                       │                               │
│   Reads on-chain                  │ Reads opportunities           │
│   price data via RPC              │                               │
│           │                       ▼                               │
│    ┌──────▼──────┐      ┌─────────────────────┐                  │
│    │  Blockchain  │      │    API Server        │                 │
│    │  Networks    │      │  (apps/api)          │◀── REST clients │
│    │  ETH/ARB/etc │      │  Express + Socket.IO │                 │
│    └─────────────┘      └─────────┬───────────┘                  │
│                                   │                               │
│                             WebSocket                             │
│                                   │                               │
│                         ┌─────────▼──────────┐                   │
│                         │    Dashboard         │                  │
│                         │  (apps/dashboard)    │                  │
│                         │  Next.js 15          │                  │
│                         └──────────────────────┘                  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Diagram

```
flashloan-ai-monorepo/
│
├── packages/shared/          ← Shared library (imported by all services)
│   ├── src/index.ts          ← Prisma client, network configs, DEX configs
│   └── prisma/schema.prisma  ← Database schema definitions
│
├── bots/price-scanner/       ← Autonomous scanning bot
│   └── src/index.ts          ← PriceScanner class, scan loop, arbitrage math
│
├── apps/api/                 ← Backend REST + WebSocket server
│   └── src/server.ts         ← Express routes, Socket.IO, DB polling
│
├── apps/dashboard/           ← Frontend monitoring UI
│   └── src/
│       ├── app/              ← Next.js App Router pages
│       ├── components/       ← React UI components
│       └── hooks/            ← Data fetching & Socket.IO hooks
│
└── docker/
    └── docker-compose.yml    ← Postgres 15 + Redis 7
```

---

## 3. Data Flow

### Opportunity Discovery Flow

```
[Blockchain RPC]
      │
      │ slot0() / getReserves()  (every 5s per pool)
      ▼
[Price Scanner]
      │
      │ Calculate triangular route output
      │ Compute gross profit, gas cost, net profit
      ▼
[PostgreSQL — Opportunity table]
      │
      │ INSERT new row
      ▼
[API Server — DB Poller]
      │
      │ SELECT WHERE createdAt > lastSeen  (every 2s)
      ▼
[Socket.IO Broadcast]
      │
      │ opportunity:new event
      ▼
[Dashboard — LiveFeed + Table]
      │
      │ Flash animation + row prepend
      ▼
[User]
```

### Settings Update Flow

```
[User edits Settings Panel]
      │
      │ PUT /api/settings
      ▼
[API Server]
      │
      │ UPSERT BotSettings
      │ io.emit('settings:updated')
      ▼
[All connected dashboards]  +  [Scanner reads settings on next scan]
```

---

## 4. Technology Stack

### Runtime

| Layer | Technology | Reason |
|-------|-----------|--------|
| Language | TypeScript 5.3 | Type safety across all services |
| Bot runtime | Node.js + tsx (watch) | Fast dev iteration, no build step |
| API framework | Express 4 | Lightweight, battle-tested |
| WebSocket | Socket.IO 4 | Reliable real-time with fallbacks |
| UI framework | Next.js 15 (App Router) | SSR, file-based routing, React 19 |
| UI components | React 19 + Tailwind CSS | Component model + utility CSS |
| Charts | Recharts 2 | React-native charting library |
| Blockchain | ethers.js v6 | Industry-standard Ethereum library |

### Data

| Layer | Technology | Reason |
|-------|-----------|--------|
| Primary DB | PostgreSQL 15 | Reliable relational store with JSON support |
| ORM | Prisma 5 | Type-safe DB client with migrations |
| Cache | Redis 7 | Future rate limiting and pub/sub |
| Docker | Docker Compose v2 | Single-command local infra |

---

## 5. Database Schema

```prisma
model Opportunity {
  id           String   @id @default(uuid())
  createdAt    DateTime @default(now())
  chain        String   // "ethereum" | "arbitrum" | ...
  route        String   // "WETH -> USDC -> DAI -> WETH"
  grossProfit  Float
  gasCost      Float
  netProfit    Float
  status       String   // SIMULATED | DETECTED | EXECUTING | SUCCESS | FAILED
  txHash       String?
  errorMessage String?
  details      Json?    // { inputAmount, outputAmount, gasPrice, timestamp }

  @@index([chain])
  @@index([status])
  @@index([createdAt])
}

model PoolConfig {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  chain     String
  dex       String   // "UniswapV3" | "SushiSwapV2" | "QuickSwapV2"
  address   String   // Pool contract address
  token0    String   // e.g. "WETH"
  token1    String   // e.g. "USDC"
  fee       Int      // Fee tier in bps*100 (500 = 0.05%)
  active    Boolean  @default(true)

  @@unique([chain, address])
}

model BotSettings {
  id                 String   @id @default("default")
  updatedAt          DateTime @updatedAt
  minProfitThreshold Float    @default(10.0)
  slippageTolerance  Float    @default(0.5)
  gasMultiplier      Float    @default(1.1)
  paperTrading       Boolean  @default(true)
  activeChains       String   @default("arbitrum")
}
```

### Indexes

| Index | Column(s) | Purpose |
|-------|-----------|---------|
| `@@index([chain])` | chain | Filter by chain |
| `@@index([status])` | status | Filter by status |
| `@@index([createdAt])` | createdAt | Time-range queries for chart |

---

## 6. Price Scanner Design

### Class: `PriceScanner`

```typescript
class PriceScanner {
  private provider: ethers.JsonRpcProvider   // RPC connection
  private chainName: string                  // e.g. "arbitrum"
  private networkConfig: NetworkConfig       // From shared package
  private pools: PoolCache[]                 // Cached pool contracts
  private isScanning: boolean                // Prevents concurrent scans

  async init()            // Connect RPC, bootstrap pools, cache contracts
  async start()           // Start setInterval scan loop
  private async scan()    // One scan cycle: fetch prices → detect opportunities
  private calculateSwapOutput()    // Simulate a single swap
  private calculateUniswapV3Price()  // Convert sqrtPriceX96 to human price
}
```

### Pool Caching Strategy

On init, the scanner loads all active `PoolConfig` rows from the database and creates `ethers.Contract` instances **once**. This avoids creating new contract objects on every scan cycle — reducing overhead significantly.

### Price Calculation

**Uniswap V3 (slot0)**
```
ratio = sqrtPriceX96 / 2^96
rawPrice = ratio²
token0PriceInToken1 = rawPrice × 10^(decimals0 - decimals1)
```

**Uniswap V2 / SushiSwap (getReserves)**
```
amountOut = (amountIn × 0.997 × reserveOut) / (reserveIn + amountIn × 0.997)
```

### Arbitrage Routes (current)

| # | Route |
|---|-------|
| 1 | WETH → USDC → DAI → WETH |
| 2 | WETH → USDT → USDC → WETH |

---

## 7. API Server Design

### Route Structure

```
GET  /api/health           → Health check
GET  /api/opportunities    → Paginated list (filterable)
GET  /api/opportunities/:id → Single opportunity
GET  /api/stats            → Aggregate KPIs
GET  /api/chart            → Time-series data (last N hours)
GET  /api/settings         → Current bot settings
PUT  /api/settings         → Update bot settings
GET  /api/pools            → Active pool configs
```

### Real-Time Broadcasting

The API polls the database every 2 seconds for new `Opportunity` rows (using `createdAt > lastSeen` cursor). This is simpler and more reliable than database triggers for the current scale.

```typescript
let lastSeenOpportunityTime = new Date();

setInterval(async () => {
  const newOps = await prisma.opportunity.findMany({
    where: { createdAt: { gt: lastSeenOpportunityTime } }
  });
  newOps.forEach(op => io.emit('opportunity:new', op));
}, 2000);
```

### CORS Policy

- **Development:** `origin: '*'` (all origins allowed)
- **Production:** Should be restricted to the dashboard's domain

---

## 8. Dashboard Design

### Component Tree

```
page.tsx (data coordinator)
  ├── StatsBar        ← 7 KPI glass cards
  ├── ProfitChart     ← Recharts LineChart (6h time series)
  ├── OpportunitiesTable  ← Sortable, filterable data table
  ├── LiveFeed        ← Socket.IO event stream with flash animations
  └── SettingsPanel   ← Forms with PUT /api/settings on save
```

### Data Fetching Strategy

| Data | Method | Interval |
|------|--------|----------|
| Opportunities (initial) | REST poll | 8 seconds |
| Stats | REST poll | 8 seconds |
| Chart data | REST poll | 8 seconds |
| Settings | REST poll | 8 seconds |
| New opportunities | WebSocket push | Instant |
| Settings changes | WebSocket push | Instant |

The polling ensures the dashboard stays consistent even if the WebSocket connection is briefly interrupted.

### Design System

- **Background:** Deep navy `#050d1a` with subtle green grid
- **Cards:** Glassmorphism — `backdrop-filter: blur(16px)` with translucent borders
- **Accent color:** Emerald `#10b981` with glow effects
- **Font:** Inter (UI) + JetBrains Mono (numbers/addresses)
- **Animations:** `flashGreen` keyframe on new opportunities, `livePulse` on connection dot

---

## 9. Shared Package

`@flashloan/shared` is consumed by all three runtime services. It exports:

| Export | Type | Description |
|--------|------|-------------|
| `prisma` | `PrismaClient` | Singleton DB client |
| `NETWORKS` | `Record<string, NetworkConfig>` | Per-chain RPC, token, and DEX configs |
| `FLASH_LOAN_PROVIDERS` | `Record<string, Record<string, FlashLoanProvider>>` | Aave, Balancer addresses and fees |
| `ChainId` | `enum` | Numeric chain IDs |
| `TokenConfig` | `interface` | Token symbol/address/decimals |
| `DexConfig` | `interface` | DEX factory/router/quoter addresses |

---

## 10. Security Model

### Current (Paper Trading)

| Risk | Mitigation |
|------|-----------|
| No real funds at risk | `PAPER_TRADING=true` — zero on-chain transactions |
| Public RPC rate limits | Replace with private Alchemy/QuickNode endpoints |
| DB credential exposure | `.env` excluded from git via `.gitignore` |

### Production Security (Live Trading)

| Risk | Mitigation |
|------|-----------|
| Private key storage | Hardware wallet / KMS (never in `.env`) |
| MEV front-running | Use Flashbots bundles for private mempool submission |
| Slippage attacks | Enforce `slippageTolerance` on-chain in smart contract |
| API exposure | Auth middleware (JWT) + rate limiting + HTTPS |
| Smart contract risk | Full audit before deploying flash loan executor contract |

---

## 11. Future Roadmap

### Version 2.0 — Live Execution
- [ ] Flash loan executor Solidity smart contract (Aave + Balancer)
- [ ] Flashbots bundle submission for MEV protection
- [ ] On-chain execution via the scanner bot
- [ ] Telegram/Discord alert bot for DETECTED opportunities

### Version 2.1 — Expanded Coverage
- [ ] More DEXes: Curve, Balancer, Camelot, Aerodrome
- [ ] More token pairs: WBTC, LINK, ARB, OP
- [ ] Cross-chain arbitrage (bridge-aware routes)
- [ ] Dynamic route discovery (not just hardcoded triangular routes)

### Version 3.0 — AI-Assisted
- [ ] ML model to predict which routes are most likely to be profitable
- [ ] Gas price prediction to avoid executing in high-gas windows
- [ ] Reinforcement learning for dynamic threshold tuning
- [ ] Anomaly detection for smart contract risks

---

*Last updated: July 2026*

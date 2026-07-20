# 📋 Changelog — FlashLoan AI

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-07-20

### Added

#### Infrastructure
- Docker Compose setup with PostgreSQL 15 and Redis 7
- npm workspaces monorepo with `apps/`, `bots/`, and `packages/`
- Root-level `.env` configuration for all services

#### `packages/shared`
- Prisma schema with `Opportunity`, `PoolConfig`, and `BotSettings` models
- `NETWORKS` configuration for Ethereum, Arbitrum, Polygon, Base, Optimism
- `FLASH_LOAN_PROVIDERS` config for Aave V3 and Balancer on Ethereum/Arbitrum
- `TokenConfig`, `DexConfig`, `NetworkConfig` TypeScript interfaces
- `ChainId` enum for all supported networks

#### `bots/price-scanner`
- `PriceScanner` class with full scan loop (configurable interval via `SCAN_INTERVAL_MS`)
- On-chain price fetching via Uniswap V3 `slot0()` and V2 `getReserves()`
- EIP-55 checksum normalization for all pool addresses (`ethers.getAddress`)
- Triangular arbitrage simulation: WETH→USDC→DAI→WETH, WETH→USDT→USDC→WETH
- Gas cost estimation (280,000 gas units × current gas price)
- Automatic pool config bootstrapping on first run (5 Arbitrum pools)
- Opportunity logging to PostgreSQL with gross profit, gas cost, net profit, status
- `BotSettings` upsert — reads live settings each scan cycle

#### `apps/api`
- Express 4 server with CORS and JSON middleware
- Socket.IO 4 WebSocket server with auto-reconnect
- DB polling every 2 seconds → broadcasts `opportunity:new` to connected dashboards
- `GET /api/health` — uptime check
- `GET /api/opportunities` — paginated list with chain/status filters
- `GET /api/opportunities/:id` — single opportunity detail
- `GET /api/stats` — aggregate KPIs (total, profitable, success rate, best trade)
- `GET /api/chart` — time-series data for the last N hours
- `GET /api/settings` — bot settings with auto-create default
- `PUT /api/settings` — update settings + broadcast `settings:updated` event
- `GET /api/pools` — active pool configurations

#### `apps/dashboard`
- Next.js 15 (App Router) with React 19
- Dark DeFi theme: deep navy background, neon green accents, glassmorphism cards
- Inter + JetBrains Mono font stack via Google Fonts
- `StatsBar` — 7 real-time KPI metric cards
- `ProfitChart` — Recharts line chart for net profit / gross profit / gas (6h window)
- `OpportunitiesTable` — sortable table with status/chain filters and profit coloring
- `LiveFeed` — Socket.IO powered event stream with flash-green animation on new events
- `SettingsPanel` — live-editable bot settings with paper trading toggle
- `useSocket` hook — Socket.IO client with auto-reconnect
- `useOpportunities` hook — polling + addOpportunity for WebSocket incremental updates
- Connection status indicator (🟢 LIVE / 🔴 OFFLINE)

#### Documentation
- `README.md` — project overview, quick start, scripts, environment variables
- `USER.md` — user quick-start reference guide
- `docs/USER_MANUAL.md` — full user manual with all dashboard features explained
- `docs/API.md` — complete REST + WebSocket API reference with examples
- `docs/ADMIN.md` — admin/ops guide: deployment, PM2, Nginx, backup, security
- `docs/ARCHITECTURE.md` — system design, data flow, DB schema, component diagrams
- `CHANGELOG.md` — this file
- `CONTRIBUTING.md` — contribution guidelines
- `.env.example` — template environment file

### Fixed
- EIP-55 address checksum validation error for Arbitrum USDT/USDC pool (`0xbe3ded...`)
  — all pool addresses now normalized via `ethers.getAddress(addr.toLowerCase())`

---

## [Unreleased]

### Planned — v1.1.0
- [ ] Telegram / Discord alerts for DETECTED opportunities
- [ ] More DEX support: Curve, Camelot, Aerodrome, Balancer
- [ ] Additional token pairs: WBTC, ARB, OP, LINK
- [ ] Multi-chain scanner (run multiple chains concurrently)

### Planned — v2.0.0
- [ ] Solidity flash loan executor contract (Aave + Balancer)
- [ ] Flashbots bundle submission (MEV protection)
- [ ] Live execution mode with full on-chain settlement
- [ ] Wallet integration (private key via KMS)

### Planned — v3.0.0
- [ ] ML profit prediction model
- [ ] Reinforcement learning for dynamic threshold tuning
- [ ] Gas price forecasting
- [ ] Cross-chain arbitrage routes

---

*Format: [Keep a Changelog](https://keepachangelog.com) · Versioning: [SemVer](https://semver.org)*

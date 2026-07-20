# ⚡ FlashLoan AI — Multi-Chain Arbitrage Platform

<div align="center">

![Flash Loan AI](https://img.shields.io/badge/FlashLoan-AI-10b981?style=for-the-badge&logo=ethereum&logoColor=white)
![Status](https://img.shields.io/badge/Status-Paper%20Trading-f59e0b?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)

**An autonomous, AI-powered flash loan arbitrage scanner and execution platform.**  
Detects triangular arbitrage opportunities across Uniswap V3, SushiSwap, QuickSwap, and more  
on Ethereum, Arbitrum, Polygon, Base, and Optimism — all from a stunning real-time dashboard.

[User Guide](./USER.md) · [User Manual](./docs/USER_MANUAL.md) · [API Docs](./docs/API.md) · [Admin Guide](./docs/ADMIN.md) · [Architecture](./docs/ARCHITECTURE.md) · [Changelog](./CHANGELOG.md)

</div>

---

## 🌟 Features

- 🔍 **Real-time price scanning** across multiple DEXes and chains (every 5s)
- ⚡ **Triangular arbitrage detection** (WETH → USDC → DAI → WETH, etc.)
- 📊 **Live dashboard** with profit charts, opportunity feed, and KPI stats
- 🔌 **WebSocket streaming** — opportunities push to dashboard instantly
- 🛡️ **Paper trading mode** — simulate without risking real funds
- ⚙️ **Configurable risk engine** — min profit threshold, slippage, gas multiplier
- 🗄️ **PostgreSQL persistence** — all opportunities logged for analysis
- 🐋 **Docker-first** infrastructure (Postgres + Redis in one command)

---

## 🏗️ Architecture

```
flashloan-ai-monorepo/
├── apps/
│   ├── api/           # Express + Socket.IO REST API (port 4000)
│   └── dashboard/     # Next.js 15 real-time dashboard (port 3000)
├── bots/
│   └── price-scanner/ # Arbitrage scanner bot (runs on Arbitrum by default)
├── packages/
│   └── shared/        # Shared configs, Prisma client, network/DEX definitions
└── docker/
    └── docker-compose.yml  # Postgres + Redis
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | Included with Node.js |
| Docker Desktop | Latest | [docker.com](https://docker.com) |

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/flashloan-ai.git
cd flashloan-ai
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your RPC endpoints
```

### 3. Start Infrastructure

```bash
npm run dev:infra
```

### 4. Push Database Schema (one-time)

```powershell
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/flashloan_db?schema=public"
npx prisma db push --schema=packages/shared/prisma/schema.prisma
```

```bash
# Linux / macOS
DATABASE_URL="postgresql://postgres:password@localhost:5432/flashloan_db?schema=public" \
  npx prisma db push --schema=packages/shared/prisma/schema.prisma
```

### 5. Launch Everything

```bash
npm run dev:all
```

Open **http://localhost:3000** 🎉

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start all services concurrently |
| `npm run dev:infra` | Start Docker containers (Postgres + Redis) |
| `npm run dev:api` | Start API server only (port 4000) |
| `npm run dev:scanner` | Start price scanner bot only |
| `npm run dev:dashboard` | Start Next.js dashboard only (port 3000) |
| `npm run build` | Build all workspaces for production |

---

## 🔐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `RPC_ETH` | Cloudflare public | Ethereum JSON-RPC endpoint |
| `RPC_ARBITRUM` | Public | Arbitrum JSON-RPC endpoint |
| `RPC_POLYGON` | Public | Polygon JSON-RPC endpoint |
| `RPC_BASE` | Public | Base JSON-RPC endpoint |
| `RPC_OPTIMISM` | Public | Optimism JSON-RPC endpoint |
| `PORT` | `4000` | API server port |
| `SCAN_INTERVAL_MS` | `5000` | Price scan interval in ms |
| `MIN_PROFIT_THRESHOLD_USD` | `10.0` | Min net profit to flag as DETECTED |
| `PAPER_TRADING` | `true` | Disable for live execution |

> ⚠️ **Use private RPC endpoints** (Alchemy/QuickNode) in production for speed and reliability.

---

## 🌐 Supported Networks & DEXes

| Network | Chain ID | DEXes |
|---------|----------|-------|
| Ethereum | 1 | Uniswap V3, SushiSwap V2 |
| Arbitrum One | 42161 | Uniswap V3, SushiSwap V2 |
| Polygon | 137 | Uniswap V3, QuickSwap V2 |
| Base | 8453 | Uniswap V3 |
| Optimism | 10 | Uniswap V3 |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [USER.md](./USER.md) | Quick-start user guide (start here!) |
| [docs/USER_MANUAL.md](./docs/USER_MANUAL.md) | Full user manual — dashboard features, data interpretation, FAQ |
| [docs/API.md](./docs/API.md) | REST + WebSocket API reference with examples |
| [docs/ADMIN.md](./docs/ADMIN.md) | Deployment, PM2, Nginx, backup, security |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, data flow, DB schema, component diagrams |
| [CHANGELOG.md](./CHANGELOG.md) | Version history and release notes |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute — workflow, standards, PR process |
| [.env.example](./.env.example) | Environment variable template |

---

## ⚠️ Disclaimer

This software is for **educational and research purposes only**.  
Flash loan arbitrage involves significant financial risk.  
Always test with `PAPER_TRADING=true` before using real funds.  
The authors are not responsible for any financial losses.

---

## 📄 License

MIT — see [LICENSE](./LICENSE) for details.

# 👤 User Guide — FlashLoan AI

> Quick-start reference for running and using the FlashLoan AI arbitrage platform.  
> For the full manual see [docs/USER_MANUAL.md](./docs/USER_MANUAL.md)

---

## 🚀 Start the Platform

```bash
# 1. Start Docker (Postgres + Redis)
npm run dev:infra

# 2. First-time only — push DB schema
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/flashloan_db?schema=public"
npx prisma db push --schema=packages/shared/prisma/schema.prisma

# 3. Launch everything
npm run dev:all
```

Then open **http://localhost:3000** in your browser.

---

## 🖥️ Dashboard at a Glance

| Section | What It Does |
|---------|-------------|
| **Stats Bar** (top) | Live KPIs — total scans, detected opportunities, profit, success rate |
| **Profit Chart** | 6-hour time-series of net profit, gross profit, and gas cost |
| **Opportunities Table** | Filterable list of all detected arbitrage routes |
| **Live Feed** (right) | Real-time stream of new opportunities (flashes green on arrival) |
| **Bot Settings** (bottom right) | Configure thresholds, toggle paper trading, set active chains |

---

## ⚙️ Key Settings

| Setting | Default | What to Change |
|---------|---------|---------------|
| Paper Trading | `ON` ✅ | Keep ON until fully tested — no real money moves |
| Min Profit Threshold | `$10.00` | Lower to see more DETECTED events in testing |
| Slippage Tolerance | `0.5%` | How much price movement is acceptable per swap |
| Gas Multiplier | `1.1` | Safety buffer on gas estimates (+10%) |
| Active Chains | `arbitrum` | Add `polygon`, `ethereum`, etc. (comma-separated) |

---

## 📊 Reading Opportunity Status

| Status | Meaning |
|--------|---------|
| `SIMULATED` ⬜ | Scanned but profit below your threshold |
| `DETECTED` 🟢 | Profit exceeds threshold — ready to execute |
| `SUCCESS` 💚 | Flash loan executed successfully (live mode) |
| `FAILED` 🔴 | Execution failed (reverted / front-run) |

---

## 💡 Profit Formula

```
Net Profit = (Output Token - Input Token) × Token USD Price - Gas Cost USD
```

A route is **profitable** when `Net Profit > 0` AND `Net Profit ≥ Min Profit Threshold`.

---

## 🔗 Supported Routes (Arbitrum)

| # | Route | Pools |
|---|-------|-------|
| 1 | WETH → USDC → DAI → WETH | Uniswap V3 × 3 |
| 2 | WETH → USDT → USDC → WETH | Uniswap V3 × 3 |

---

## 🛑 Stopping the Platform

Press `Ctrl + C` in the terminal running `npm run dev:all`, or kill individual processes.

To stop Docker containers:
```bash
docker-compose -f docker/docker-compose.yml down
```

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---------|-----|
| Dashboard shows **OFFLINE** | Run `npm run dev:api` |
| Scanner shows `P1001 database error` | Run `npm run dev:infra` (start Docker) |
| `bad address checksum` error | DB has stale data — truncate PoolConfig and restart scanner |
| Chart has no data | Wait a few scan cycles (scanner runs every 5s) |
| All scans are `SIMULATED` | Lower Min Profit Threshold in Settings |

---

> 📚 Full docs: [User Manual](./docs/USER_MANUAL.md) · [API Docs](./docs/API.md) · [Admin Guide](./docs/ADMIN.md) · [Architecture](./docs/ARCHITECTURE.md)

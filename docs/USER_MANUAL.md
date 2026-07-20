# 📖 User Manual — FlashLoan AI Dashboard

> **Audience:** Traders, analysts, and DeFi enthusiasts using the FlashLoan AI platform.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Stats Bar](#3-stats-bar)
4. [Profit Chart](#4-profit-chart)
5. [Opportunities Table](#5-opportunities-table)
6. [Live Event Feed](#6-live-event-feed)
7. [Bot Settings](#7-bot-settings)
8. [Understanding Arbitrage Data](#8-understanding-arbitrage-data)
9. [Status Definitions](#9-status-definitions)
10. [FAQ](#10-faq)

---

## 1. Getting Started

### Accessing the Dashboard

Once the platform is running, open your browser and navigate to:

```
http://localhost:3000
```

The dashboard connects automatically to the API at `http://localhost:4000`.

### Connection Status

Look for the indicator in the top-right corner of the header:

| Indicator | Meaning |
|-----------|---------|
| 🟢 **LIVE** | WebSocket connected — real-time updates active |
| 🔴 **OFFLINE** | WebSocket disconnected — data may be stale |

If you see **OFFLINE**, ensure the API server is running (`npm run dev:api`).

---

## 2. Dashboard Overview

The dashboard is organized into four main sections:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ FlashLoan AI Dashboard                        🟢 LIVE    │
├───────────────────────────────────────────────────────────  │
│  [Stats Bar] — 7 KPI metric cards                           │
├─────────────────────────────────────────────────────────────┤
│  [Profit Chart] — 6-hour time series line chart             │
├────────────────────────────┬────────────────────────────────┤
│                            │  [Live Event Feed]             │
│  [Opportunities Table]     ├────────────────────────────────┤
│                            │  [Bot Settings Panel]          │
└────────────────────────────┴────────────────────────────────┘
```

Data refreshes automatically every 8 seconds via polling, and immediately for new opportunities via WebSocket.

---

## 3. Stats Bar

Seven KPI cards at the top provide an at-a-glance health check of the system.

| Card | What It Shows |
|------|---------------|
| **Total Scans** | All-time number of opportunities evaluated |
| **Last 24h** | Opportunities scanned in the past 24 hours |
| **Detected** | Opportunities that exceeded your profit threshold |
| **Success Rate** | Percentage of scans that were profitable (net > $0) |
| **Net Profit** | Cumulative net profit across all detected opportunities (USD) |
| **Best Trade** | The single highest net profit ever recorded |
| **Avg Net** | Average net profit per scan |

### Color Coding

- 🟢 **Neon green** — positive/profitable value
- ⬜ **Slate/neutral** — neutral metric
- 🔴 **Rose/red** — negative value (net loss)

---

## 4. Profit Chart

The line chart displays the last **6 hours** of scan data with three series:

| Line | Color | Description |
|------|-------|-------------|
| **Net Profit** | 🟢 Green (solid) | Gross profit minus gas cost — your actual gain |
| **Gross Profit** | 🔵 Blue (dashed) | Raw profit from price difference before gas |
| **Gas Cost** | 🔴 Red (dashed) | Displayed as negative — subtracted from gross |

### Reading the Chart

- A **Net Profit line above zero** = profitable scan
- **Net and Gross close together** = low gas conditions (good)
- **Large gap between Gross and Net** = high gas or congested network
- Hover over any point to see exact values in a tooltip

---

## 5. Opportunities Table

The table lists all detected arbitrage opportunities, most recent first.

### Columns

| Column | Description |
|--------|-------------|
| **Time** | How long ago the opportunity was detected (e.g., "12s ago") |
| **Chain** | Network with emoji icon (🔵 Arbitrum, ⟠ Ethereum, 🟣 Polygon, etc.) |
| **Route** | Token path for the triangular trade (e.g., `WETH → USDC → DAI → WETH`) |
| **Gross** | USD profit before gas deduction |
| **Gas** | Estimated gas cost in USD (amber color) |
| **Net** | Final profit after gas — green if positive, red if negative |
| **Status** | Current state of the opportunity (see Status Definitions) |

### Filtering

Use the filter controls above the table to narrow results:

- **ALL / DETECTED / SIMULATED** — filter by opportunity status
- **Chain dropdown** — filter by specific blockchain network

---

## 6. Live Event Feed

The Live Event Feed shows a scrolling real-time stream of opportunities as they are discovered by the scanner. New items flash **green** briefly when they arrive.

Each event shows:
- **Chain icon** and chain name
- **Route** — the triangular arbitrage path
- **Net profit** — green if positive, gray if near zero, red if loss
- **Status** and exact timestamp

> The feed holds the last **80 events** in memory. Older events scroll off the top.

---

## 7. Bot Settings

The settings panel allows you to configure the scanner's behavior **without restarting** the bot. Changes are saved to the database immediately.

### Settings Reference

| Setting | Default | Description |
|---------|---------|-------------|
| **Paper Trading** | `ON` | When enabled, no real transactions are executed. **Always keep ON until fully tested.** |
| **Min Profit Threshold** | `$10.00` | Minimum net USD profit for an opportunity to be marked as `DETECTED`. Opportunities below this are logged as `SIMULATED`. |
| **Slippage Tolerance** | `0.5%` | Maximum allowed price slippage per swap. Higher = more likely to execute but lower actual profit. |
| **Gas Multiplier** | `1.1` | Safety buffer applied to gas estimates. `1.1` = assumes gas will be 10% higher than current quote. |
| **Active Chains** | `arbitrum` | Comma-separated list of chains the scanner monitors. E.g. `arbitrum,polygon` |

### Saving Settings

1. Modify any value in the form
2. Click **Save Settings**
3. You will see ✅ **Saved!** confirmation
4. The new settings take effect on the next scan cycle

> Changes are broadcast to all connected dashboard clients via WebSocket.

---

## 8. Understanding Arbitrage Data

### What is Triangular Arbitrage?

Triangular arbitrage exploits price discrepancies across three token pairs on one or more DEXes. The bot simulates buying Token A → Token B → Token C → back to Token A.

**Example route:** `WETH → USDC → DAI → WETH`

1. Swap **1 WETH** → **USDC** on Uniswap V3
2. Swap **USDC** → **DAI** on SushiSwap
3. Swap **DAI** → **WETH** on Uniswap V3
4. If the final WETH amount > 1, there is an **arbitrage profit**

### How Profit is Calculated

```
Gross Profit (USD) = (Output WETH - Input WETH) × ETH/USD price
Gas Cost (USD)     = Estimated Gas Units × Gas Price × ETH/USD price
Net Profit (USD)   = Gross Profit - Gas Cost
```

### Flash Loan Providers

| Provider | Fee | Network |
|----------|-----|---------|
| Aave V3 | 0.09% | Ethereum, Arbitrum |
| Balancer | 0.00% | Ethereum, Arbitrum |

> Balancer offers **free flash loans** — no fee on the borrowed principal.

---

## 9. Status Definitions

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| `SIMULATED` | ⬜ Gray | Opportunity detected but net profit below your threshold |
| `DETECTED` | 🟢 Green | Net profit exceeds your minimum threshold — ready to execute |
| `EXECUTING` | 🟡 Amber | Transaction submitted to mempool (live mode only) |
| `SUCCESS` | 💚 Bright Green | Flash loan executed and profit realized on-chain |
| `FAILED` | 🔴 Red | Execution failed (reverted, slippage, front-run) |
| `REJECTED_RISK_ENGINE` | 🟠 Orange | Blocked by internal risk checks |

---

## 10. FAQ

**Q: Why are all opportunities showing as `SIMULATED`?**  
A: Your minimum profit threshold may be too high, or current market conditions offer little arbitrage. Lower the threshold in Settings to see more `DETECTED` events.

**Q: The dashboard shows "OFFLINE" — what do I do?**  
A: Make sure the API server is running: `npm run dev:api`. Check that Docker containers are up: `docker ps`.

**Q: The chart shows no data.**  
A: The chart displays the last 6 hours. If the scanner was just started, wait a few scan cycles for data to populate.

**Q: Can I run the scanner on multiple chains at once?**  
A: Yes. Set `Active Chains` in Settings to a comma-separated list, e.g. `arbitrum,polygon`. Ensure you have a corresponding RPC endpoint in `.env`.

**Q: How accurate are the profit estimates?**  
A: They are **simulated** estimates based on current on-chain pool state. Real execution may differ due to gas spikes, MEV front-running, or pool state changes between detection and execution.

**Q: Is my money safe?**  
A: In Paper Trading mode (default), no transactions are made. No funds are at risk. Only disable Paper Trading when you have thoroughly tested and audited the execution logic.

---

*Last updated: July 2026*

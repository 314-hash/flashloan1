# 🔌 API Reference — FlashLoan AI

**Base URL:** `http://localhost:4000`  
**WebSocket URL:** `ws://localhost:4000`  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Health Check](#1-health-check)
2. [Opportunities](#2-opportunities)
3. [Stats](#3-stats)
4. [Chart Data](#4-chart-data)
5. [Settings](#5-settings)
6. [Pool Configs](#6-pool-configs)
7. [WebSocket Events](#7-websocket-events)
8. [Data Models](#8-data-models)
9. [Error Handling](#9-error-handling)

---

## 1. Health Check

### `GET /api/health`

Returns server status and current timestamp.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2026-07-20T09:00:00.000Z"
}
```

---

## 2. Opportunities

### `GET /api/opportunities`

Returns a paginated list of arbitrage opportunities, newest first.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `50` | Results per page (max 200) |
| `chain` | string | — | Filter by chain name (e.g. `arbitrum`) |
| `status` | string | — | Filter by status (e.g. `DETECTED`) |

**Example Request**
```
GET /api/opportunities?chain=arbitrum&status=DETECTED&page=1&limit=20
```

**Response**
```json
{
  "data": [
    {
      "id": "uuid-1234",
      "createdAt": "2026-07-20T09:05:00.000Z",
      "chain": "arbitrum",
      "route": "WETH -> USDC -> DAI -> WETH",
      "grossProfit": 45.2100,
      "gasCost": 2.8400,
      "netProfit": 42.3700,
      "status": "DETECTED",
      "txHash": null,
      "details": {
        "inputAmount": 1,
        "outputAmount": 1.0132,
        "gasPrice": "200000000",
        "timestamp": 1721469900000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "pages": 8
  }
}
```

---

### `GET /api/opportunities/:id`

Returns a single opportunity by ID.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Opportunity ID |

**Response** — same schema as a single item in the list above.

**Error — 404 Not Found**
```json
{ "error": "Not found" }
```

---

## 3. Stats

### `GET /api/stats`

Returns aggregate statistics for the dashboard KPI cards.

**Response**
```json
{
  "total": 1248,
  "profitable": 312,
  "simulated": 936,
  "detected": 312,
  "last24h": 288,
  "successRate": "25.0",
  "totalNetProfit": "1284.3200",
  "totalGrossProfit": "1540.8000",
  "totalGasCost": "256.4800",
  "avgNetProfit": "4.1132",
  "bestNetProfit": "84.2300",
  "bestRoute": "WETH -> USDC -> DAI -> WETH"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | All-time opportunity count |
| `profitable` | integer | Count with `netProfit > 0` |
| `detected` | integer | Count with status = `DETECTED` |
| `last24h` | integer | Opportunities in the last 24 hours |
| `successRate` | string | `(profitable / total) * 100` as string |
| `totalNetProfit` | string | Sum of all net profits (USD) |
| `bestNetProfit` | string | Highest single net profit (USD) |
| `bestRoute` | string | Route of the best trade |

---

## 4. Chart Data

### `GET /api/chart`

Returns time-series data for the profit chart.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | integer | `6` | Number of past hours to include |

**Response**
```json
{
  "data": [
    {
      "createdAt": "2026-07-20T03:05:00.000Z",
      "netProfit": 12.4500,
      "grossProfit": 15.2300,
      "gasCost": 2.7800,
      "route": "WETH -> USDC -> DAI -> WETH",
      "chain": "arbitrum",
      "status": "DETECTED"
    }
  ]
}
```

---

## 5. Settings

### `GET /api/settings`

Returns current bot settings. Creates default settings if none exist.

**Response**
```json
{
  "id": "default",
  "updatedAt": "2026-07-20T09:00:00.000Z",
  "minProfitThreshold": 10.0,
  "slippageTolerance": 0.5,
  "gasMultiplier": 1.1,
  "paperTrading": true,
  "activeChains": "arbitrum"
}
```

---

### `PUT /api/settings`

Updates bot settings. All fields are optional — only send what you want to change.

**Request Body**
```json
{
  "minProfitThreshold": 5.0,
  "slippageTolerance": 0.3,
  "gasMultiplier": 1.2,
  "paperTrading": true,
  "activeChains": "arbitrum,polygon"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `minProfitThreshold` | float | Min net USD profit to flag as DETECTED |
| `slippageTolerance` | float | Max slippage % per swap |
| `gasMultiplier` | float | Gas estimate safety buffer (1.0 = no buffer) |
| `paperTrading` | boolean | `true` = simulate only, no real execution |
| `activeChains` | string | Comma-separated chain names |

**Response** — the full updated settings object (same as GET response).

> This endpoint also broadcasts a `settings:updated` WebSocket event to all connected clients.

---

## 6. Pool Configs

### `GET /api/pools`

Returns active liquidity pool configurations used by the scanner.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chain` | string | — | Filter by chain name |

**Response**
```json
{
  "data": [
    {
      "id": "uuid-abc",
      "createdAt": "2026-07-20T09:00:00.000Z",
      "chain": "arbitrum",
      "dex": "UniswapV3",
      "address": "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443",
      "token0": "WETH",
      "token1": "USDC",
      "fee": 500,
      "active": true
    }
  ]
}
```

---

## 7. WebSocket Events

Connect to the WebSocket server using Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

### Events Emitted by Server

#### `opportunity:new`

Fired every time the scanner discovers and logs a new opportunity (approximately every 5 seconds per route).

**Payload:** Full `Opportunity` object — same schema as a single item from `GET /api/opportunities`.

```javascript
socket.on('opportunity:new', (opportunity) => {
  console.log('New opportunity:', opportunity.route, opportunity.netProfit);
});
```

#### `settings:updated`

Fired when bot settings are updated via `PUT /api/settings`.

**Payload:** Full `BotSettings` object.

```javascript
socket.on('settings:updated', (settings) => {
  console.log('Paper trading:', settings.paperTrading);
});
```

### Connection Details

| Property | Value |
|----------|-------|
| Transport | WebSocket (with polling fallback) |
| Reconnection | Auto-reconnect, 10 attempts, 1s delay |
| Polling interval | Server polls DB every 2 seconds for new opportunities |

---

## 8. Data Models

### Opportunity

```typescript
interface Opportunity {
  id: string;               // UUID
  createdAt: string;        // ISO 8601 datetime
  chain: string;            // "ethereum" | "arbitrum" | "polygon" | "base" | "optimism"
  route: string;            // e.g. "WETH -> USDC -> DAI -> WETH"
  grossProfit: number;      // USD profit before gas
  gasCost: number;          // Estimated gas cost in USD
  netProfit: number;        // grossProfit - gasCost
  status: OpportunityStatus;
  txHash: string | null;    // On-chain tx hash (live mode only)
  errorMessage: string | null;
  details: {
    inputAmount: number;    // e.g. 1.0 (1 WETH)
    outputAmount: number;   // e.g. 1.013 (output WETH)
    gasPrice: string;       // Wei as string
    timestamp: number;      // Unix ms
  } | null;
}

type OpportunityStatus =
  | 'SIMULATED'
  | 'DETECTED'
  | 'EXECUTING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REJECTED_RISK_ENGINE';
```

### BotSettings

```typescript
interface BotSettings {
  id: 'default';
  updatedAt: string;
  minProfitThreshold: number;  // USD
  slippageTolerance: number;   // Percent
  gasMultiplier: number;       // Multiplier (e.g. 1.1)
  paperTrading: boolean;
  activeChains: string;        // Comma-separated
}
```

### PoolConfig

```typescript
interface PoolConfig {
  id: string;
  createdAt: string;
  chain: string;
  dex: string;         // "UniswapV3" | "SushiSwapV2" | "QuickSwapV2"
  address: string;     // Pool contract address (checksummed)
  token0: string;      // Symbol e.g. "WETH"
  token1: string;      // Symbol e.g. "USDC"
  fee: number;         // Fee tier in bps×100 (500 = 0.05%, 3000 = 0.3%)
  active: boolean;
}
```

---

## 9. Error Handling

All error responses follow this format:

```json
{ "error": "Human-readable error message" }
```

| HTTP Status | Meaning |
|-------------|---------|
| `200 OK` | Success |
| `404 Not Found` | Resource does not exist |
| `500 Internal Server Error` | Server/database error |

All `500` errors are also logged to the API console with full stack traces.

---

*Last updated: July 2026*

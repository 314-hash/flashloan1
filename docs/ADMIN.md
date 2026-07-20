# 🛠️ Admin Guide — FlashLoan AI

> **Audience:** DevOps engineers, system administrators, and developers responsible for deploying and maintaining the platform.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation](#2-installation)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Management](#4-database-management)
5. [Docker Infrastructure](#5-docker-infrastructure)
6. [Running in Production](#6-running-in-production)
7. [Process Management (PM2)](#7-process-management-pm2)
8. [Monitoring & Logging](#8-monitoring--logging)
9. [Security Hardening](#9-security-hardening)
10. [Backup & Recovery](#10-backup--recovery)
11. [Scaling](#11-scaling)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. System Requirements

### Minimum (Development)

| Resource | Minimum |
|----------|---------|
| CPU | 2 cores |
| RAM | 4 GB |
| Disk | 20 GB |
| OS | Windows 10/11, macOS 12+, Ubuntu 20.04+ |

### Recommended (Production)

| Resource | Recommended |
|----------|-------------|
| CPU | 4+ cores |
| RAM | 8 GB |
| Disk | 50 GB SSD |
| Network | 1 Gbps |
| OS | Ubuntu 22.04 LTS |

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | ≥ 18 LTS | Runtime |
| npm | ≥ 9 | Package manager |
| Docker Engine | ≥ 24 | Containers |
| Docker Compose | ≥ 2.x | Orchestration |

---

## 2. Installation

### Clone the Repository

```bash
git clone https://github.com/yourorg/flashloan-ai.git
cd flashloan-ai
```

### Install Dependencies

```bash
npm install
```

### Generate Prisma Client

```bash
npm run db:generate --workspace=packages/shared
```

---

## 3. Environment Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

### Complete `.env` Reference

```env
# ── Database ───────────────────────────────────────────────
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@localhost:5432/flashloan_db?schema=public"

# ── RPC Endpoints ─────────────────────────────────────────
# Use private endpoints (Alchemy/QuickNode) in production!
RPC_ETH="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
RPC_ARBITRUM="https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY"
RPC_POLYGON="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"
RPC_BASE="https://base-mainnet.g.alchemy.com/v2/YOUR_KEY"
RPC_OPTIMISM="https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY"

# ── API Server ─────────────────────────────────────────────
PORT=4000
API_URL="http://localhost:4000"

# ── Bot Configuration ──────────────────────────────────────
SCAN_INTERVAL_MS=5000
MIN_PROFIT_THRESHOLD_USD=10.0
PAPER_TRADING=true           # Set to false for live execution
```

> ⚠️ **Never commit `.env` to version control.** Add it to `.gitignore`.

---

## 4. Database Management

### Initial Schema Push (Development)

```bash
# PowerShell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/flashloan_db?schema=public"
npx prisma db push --schema=packages/shared/prisma/schema.prisma

# Bash
DATABASE_URL="postgresql://..." \
  npx prisma db push --schema=packages/shared/prisma/schema.prisma
```

### Production Migrations

For production, use migrations instead of `db push`:

```bash
# Create a new migration
DATABASE_URL="..." npx prisma migrate dev \
  --schema=packages/shared/prisma/schema.prisma \
  --name "init"

# Apply in production
DATABASE_URL="..." npx prisma migrate deploy \
  --schema=packages/shared/prisma/schema.prisma
```

### View Database (Studio)

```bash
npm run db:studio --workspace=packages/shared
# Opens browser at http://localhost:5555
```

### Schema Location

```
packages/shared/prisma/schema.prisma
```

### Models

| Model | Purpose |
|-------|---------|
| `Opportunity` | All detected arbitrage opportunities |
| `PoolConfig` | DEX pool addresses used by the scanner |
| `BotSettings` | Runtime configuration (single row, id="default") |

---

## 5. Docker Infrastructure

### Start Containers

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Stop Containers

```bash
docker-compose -f docker/docker-compose.yml down
```

### Check Container Health

```bash
docker ps --filter "name=flashloan"
docker exec flashloan-postgres pg_isready -U postgres
docker exec flashloan-redis redis-cli ping
```

### View Logs

```bash
docker logs flashloan-postgres --tail 50
docker logs flashloan-redis --tail 50
```

### Postgres Access

```bash
docker exec -it flashloan-postgres psql -U postgres -d flashloan_db
```

### Docker Compose Services

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| PostgreSQL 15 | `flashloan-postgres` | 5432 | Primary database |
| Redis 7 | `flashloan-redis` | 6379 | Cache / rate limiting |

---

## 6. Running in Production

### Build All Apps

```bash
npm run build
```

### Start Production Services

```bash
# API
node apps/api/dist/server.js

# Price Scanner
node bots/price-scanner/dist/index.js

# Dashboard (Next.js production server)
cd apps/dashboard && npm start
```

### Vercel Deployment (Dashboard Only)

The Next.js dashboard is optimized to be deployed on Vercel as a monorepo workspace.

#### Step-by-Step Vercel Configuration

1. **Import Project:** Connect your GitHub repository to Vercel and import the repository.
2. **Project Settings:** Configure the following settings in the Vercel dashboard:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `apps/dashboard` (Vercel automatically detects the root `package-lock.json` and runs workspace install from the root).
   - **Build & Development Settings:**
     - **Build Command:** `next build` (Vercel automatically builds using Next.js from within the subdirectory).
     - **Output Directory:** Override to `.next` (Vercel default).
3. **Environment Variables:** Add the following variable under Settings -> Environment Variables:
   - `NEXT_PUBLIC_API_URL`: The public URL of your deployed Express API server (e.g., `https://api.yourdomain.com`).
4. **Deploy:** Hit Deploy. Vercel will run the workspace `postinstall` script, generate the Prisma client client, and bundle the Next.js app for production.

### Using a Reverse Proxy (Nginx)

Example Nginx config (`/etc/nginx/sites-available/flashloan`):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API + WebSocket
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

Enable with:
```bash
sudo ln -s /etc/nginx/sites-available/flashloan /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Process Management (PM2)

Install PM2 globally:

```bash
npm install -g pm2
```

### `ecosystem.config.js`

Create this file at the project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'flashloan-api',
      script: 'apps/api/dist/server.js',
      env: { NODE_ENV: 'production', PORT: 4000 },
      env_file: '.env',
      restart_delay: 3000,
      max_restarts: 10
    },
    {
      name: 'flashloan-scanner',
      script: 'bots/price-scanner/dist/index.js',
      env: { NODE_ENV: 'production' },
      env_file: '.env',
      restart_delay: 5000,
      max_restarts: 20
    }
  ]
};
```

### PM2 Commands

```bash
pm2 start ecosystem.config.js    # Start all
pm2 status                       # View process status
pm2 logs flashloan-api           # Stream API logs
pm2 logs flashloan-scanner       # Stream scanner logs
pm2 restart flashloan-api        # Restart API
pm2 save                         # Persist process list
pm2 startup                      # Auto-start on server boot
```

---

## 8. Monitoring & Logging

### Log Levels

All services use `console.log` / `console.error` with prefixed tags:

| Prefix | Service | Example |
|--------|---------|---------|
| `[API]` | Express server | `[API] Server running at http://localhost:4000` |
| `[Socket]` | WebSocket | `[Socket] Client connected: abc123` |
| `[Broadcast]` | DB poller | `[Broadcast] Emitted 2 new opportunities` |
| `[Scanner]` | Price scanner | `[Scanner] Scanning prices on Arbitrum One...` |
| `[Route]` | Arbitrage route | `[Route] WETH -> USDC -> DAI -> WETH \| Net: $12.45` |

### Recommended Monitoring Stack

| Tool | Purpose |
|------|---------|
| **PM2 Monit** | Process CPU/memory monitoring |
| **Grafana + Prometheus** | Metrics dashboards |
| **Sentry** | Error tracking and alerting |
| **UptimeRobot** | Uptime monitoring for the API health endpoint |

### Health Check Endpoint

Use `GET /api/health` for uptime monitoring:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","timestamp":"2026-07-20T09:00:00.000Z"}
```

---

## 9. Security Hardening

### Environment Variables

- Store secrets in a secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Never hardcode private keys or API keys in source code
- Rotate database passwords regularly

### Network Security

```bash
# Firewall: only expose ports 80/443 (via nginx) and 22 (SSH)
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000    # Block direct Next.js access
sudo ufw deny 4000    # Block direct API access
sudo ufw enable
```

### Database Security

```bash
# Create a dedicated DB user with limited privileges
psql -U postgres -c "CREATE USER flashloan_user WITH PASSWORD 'strong_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE flashloan_db TO flashloan_user;"
```

### API Security Checklist

- [ ] Enable CORS with specific origins (not `*`) in production
- [ ] Add rate limiting (e.g. `express-rate-limit`)
- [ ] Add authentication (JWT) if exposing API externally
- [ ] Use HTTPS in production (Let's Encrypt via Certbot)
- [ ] Set secure HTTP headers (`helmet.js`)

---

## 10. Backup & Recovery

### Automated Postgres Backup

```bash
#!/bin/bash
# backup.sh — run via cron daily

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/flashloan"

mkdir -p $BACKUP_DIR

docker exec flashloan-postgres pg_dump \
  -U postgres flashloan_db \
  | gzip > "$BACKUP_DIR/flashloan_$TIMESTAMP.sql.gz"

# Keep last 30 backups
ls -t $BACKUP_DIR/*.sql.gz | tail -n +31 | xargs -r rm
```

Add to crontab:
```bash
crontab -e
# Run daily at 3am
0 3 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
gunzip -c /backups/flashloan/flashloan_20260720_030000.sql.gz \
  | docker exec -i flashloan-postgres psql -U postgres flashloan_db
```

---

## 11. Scaling

### Horizontal Scaling Considerations

The scanner is **stateful** (caches pool contracts in memory) — run one instance per chain. Multiple instances per chain will cause duplicate DB writes.

The API server is **stateless** — scale horizontally behind a load balancer. Use Redis Pub/Sub to broadcast WebSocket events across API instances.

### Adding a New Chain

1. Add network config to `packages/shared/src/index.ts`
2. Add RPC endpoint to `.env`
3. Add pool addresses to `bootstrapPoolConfigs()` in the scanner
4. Restart the scanner

### Adding a New DEX

1. Add DEX config to the network entry in `packages/shared/src/index.ts`
2. Add pool addresses for the new DEX to the scanner's bootstrap function
3. Ensure the DEX uses V2 or V3 compatible ABI (already handled)

---

## 12. Troubleshooting

### `P1001: Can't reach database server`
- Ensure Docker is running: `docker ps`
- Check Postgres is accepting connections: `docker exec flashloan-postgres pg_isready -U postgres`
- Verify `DATABASE_URL` in `.env` is correct

### `API Connection Error` banner in dashboard
- Ensure API is running: `npm run dev:api`
- Check for port conflict on 4000: `netstat -ano | findstr :4000`

### Scanner shows `0 pools cached`
- DB schema may not have been pushed yet — run `prisma db push`
- The `bootstrapPoolConfigs()` function will auto-seed pools on first run

### WebSocket shows `OFFLINE`
- Socket.IO needs `upgrade` header support — ensure Nginx config includes WebSocket proxy settings
- Check CORS: in development, the API allows `*`; in production, set the specific origin

### High gas costs eating all profit
- Switch to a faster, private RPC endpoint (Alchemy/QuickNode)
- Lower `SCAN_INTERVAL_MS` to scan more frequently
- Consider Arbitrum (default) — lowest gas costs among supported chains

---

*Last updated: July 2026*

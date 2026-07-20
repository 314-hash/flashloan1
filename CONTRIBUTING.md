# 🤝 Contributing — FlashLoan AI

Thank you for your interest in contributing! This document explains how to get started, the development workflow, and coding standards.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Project Structure](#2-project-structure)
3. [Development Workflow](#3-development-workflow)
4. [Coding Standards](#4-coding-standards)
5. [Commit Convention](#5-commit-convention)
6. [Pull Request Process](#6-pull-request-process)
7. [Reporting Issues](#7-reporting-issues)

---

## 1. Getting Started

### Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/flashloan-ai.git
cd flashloan-ai
npm install
```

### Set Up Environment

```bash
cp .env.example .env
# Fill in your RPC endpoints
```

### Start Infrastructure

```bash
npm run dev:infra   # Starts Postgres + Redis via Docker
```

### Push DB Schema

```bash
# PowerShell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/flashloan_db?schema=public"
npx prisma db push --schema=packages/shared/prisma/schema.prisma
```

### Run All Services

```bash
npm run dev:all
```

---

## 2. Project Structure

```
flashloan-ai/
├── apps/
│   ├── api/           # Express + Socket.IO API (port 4000)
│   └── dashboard/     # Next.js 15 dashboard (port 3000)
├── bots/
│   └── price-scanner/ # On-chain arbitrage scanner
├── packages/
│   └── shared/        # Prisma client, network configs, interfaces
├── docs/              # Full documentation
└── docker/            # Docker Compose infrastructure
```

Each workspace is independently runnable. The shared package provides common types and the Prisma client.

---

## 3. Development Workflow

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation only |
| `chore/<name>` | Tooling, deps, config |

### Adding a New Chain

1. Add network config to `packages/shared/src/index.ts` under `NETWORKS`
2. Add RPC env var to `.env.example` and `.env`
3. Add pool addresses to `bootstrapPoolConfigs()` in the scanner
4. Add chain to flash loan providers if available
5. Update `docs/ARCHITECTURE.md` with the new chain

### Adding a New DEX

1. Add `DexConfig` entry under the chain in `NETWORKS`
2. Add pool addresses to the scanner's bootstrap function
3. Ensure the DEX uses V2 (constant product) or V3 (concentrated liquidity) math
4. Add ABI if it differs from Uniswap V2/V3 standard

### Modifying the Database Schema

1. Edit `packages/shared/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <migration_name> --schema=packages/shared/prisma/schema.prisma`
3. The Prisma client is auto-regenerated after migration
4. Update relevant TypeScript interfaces in `packages/shared/src/index.ts` if needed

---

## 4. Coding Standards

### TypeScript

- **Strict mode** is enabled — no `any` types without explicit justification
- Always type function parameters and return values
- Use `interface` for object shapes, `type` for unions/aliases
- Prefer `const` over `let`; avoid `var`

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Variables | camelCase | `netProfit` |
| Functions | camelCase | `calculateSwapOutput` |
| Classes | PascalCase | `PriceScanner` |
| Interfaces | PascalCase | `NetworkConfig` |
| Enums | PascalCase | `ChainId` |
| Files | camelCase / kebab-case | `server.ts`, `price-scanner` |
| Constants | UPPER_SNAKE_CASE | `SCAN_INTERVAL_MS` |
| React components | PascalCase | `StatsBar.tsx` |

### Ethers.js Address Handling

Always normalize addresses through `ethers.getAddress(addr.toLowerCase())` before passing to any contract or DB insert. This ensures valid EIP-55 checksums and prevents `bad address checksum` errors.

```typescript
// ✅ Correct
const addr = ethers.getAddress(rawAddress.toLowerCase());

// ❌ Wrong — may fail if checksum is invalid
const addr = rawAddress;
```

### React / Next.js

- All client components must have `'use client';` at the top
- Use hooks for all data fetching (`useOpportunities`, `useSocket`)
- Keep components focused — one concern per component
- Never fetch data directly inside components; use hooks

---

## 5. Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change, no feature/fix |
| `test` | Adding/modifying tests |
| `chore` | Build process, dependencies |
| `perf` | Performance improvement |
| `style` | Formatting, no logic change |

### Examples

```bash
feat(scanner): add Camelot DEX support for Arbitrum
fix(scanner): normalize pool addresses to prevent EIP-55 checksum errors
docs(api): add WebSocket event payload examples
chore(deps): upgrade ethers to v6.17.1
refactor(dashboard): extract profit calculation to shared utility
```

---

## 6. Pull Request Process

1. **Open an issue first** for anything beyond small fixes
2. Create a branch from `develop`: `git checkout -b feat/my-feature develop`
3. Make your changes following the coding standards above
4. Update relevant documentation in `docs/`
5. Add an entry to `CHANGELOG.md` under `[Unreleased]`
6. Push and open a PR against `develop`

### PR Checklist

- [ ] Code follows TypeScript strict mode (no `any`)
- [ ] All addresses normalized via `ethers.getAddress(addr.toLowerCase())`
- [ ] No secrets or private keys committed
- [ ] `.env.example` updated if new env vars added
- [ ] Documentation updated if behavior changed
- [ ] `CHANGELOG.md` updated

### PR Title Format

Follow the same Conventional Commits format:
```
feat(scanner): add support for Polygon QuickSwap V3
```

---

## 7. Reporting Issues

When reporting a bug, please include:

```markdown
## Description
What happened vs. what you expected.

## Steps to Reproduce
1. ...
2. ...

## Environment
- OS: Windows 11 / Ubuntu 22.04 / macOS 14
- Node.js: v20.x
- Docker: 24.x
- Chain: arbitrum / ethereum / etc.

## Error Output
```
Paste the full error here
```

## Logs
Relevant scanner / API logs
```

---

*By contributing, you agree that your contributions will be licensed under the MIT License.*

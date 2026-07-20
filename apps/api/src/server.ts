import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { prisma } from '@flashloan/shared';

dotenv.config({ path: '../../.env' });

const PORT = parseInt(process.env.PORT || '4000', 10);
const app = express();
const httpServer = createServer(app);

// ── Socket.IO Setup ────────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Real-Time Polling (pushes new opportunities to dashboard) ──────────────────
let lastSeenOpportunityTime = new Date();

async function pollNewOpportunities() {
  try {
    const newOps = await prisma.opportunity.findMany({
      where: { createdAt: { gt: lastSeenOpportunityTime } },
      orderBy: { createdAt: 'asc' }
    });

    if (newOps.length > 0) {
      lastSeenOpportunityTime = newOps[newOps.length - 1].createdAt;
      newOps.forEach((op) => {
        io.emit('opportunity:new', op);
      });
      console.log(`[Broadcast] Emitted ${newOps.length} new opportunities.`);
    }
  } catch (err) {
    console.error('[Poll] Error polling for new opportunities:', err);
  }
}

// Poll every 2 seconds for new DB entries
setInterval(pollNewOpportunities, 2000);

// ── REST Routes ────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/opportunities — paginated, filterable
app.get('/api/opportunities', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '50', 10);
    const chain = req.query.chain as string | undefined;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (chain) where.chain = chain;
    if (status) where.status = status;

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.opportunity.count({ where })
    ]);

    res.json({
      data: opportunities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[GET /opportunities]', err);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// GET /api/opportunities/:id
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: req.params.id }
    });
    if (!opportunity) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(opportunity);
  } catch (err) {
    console.error('[GET /opportunities/:id]', err);
    res.status(500).json({ error: 'Failed to fetch opportunity' });
  }
});

// GET /api/stats — aggregate dashboard metrics
app.get('/api/stats', async (_req, res) => {
  try {
    const [total, profitable, simulated, detected] = await Promise.all([
      prisma.opportunity.count(),
      prisma.opportunity.count({ where: { netProfit: { gt: 0 } } }),
      prisma.opportunity.count({ where: { status: 'SIMULATED' } }),
      prisma.opportunity.count({ where: { status: 'DETECTED' } })
    ]);

    const bestTrade = await prisma.opportunity.findFirst({
      orderBy: { netProfit: 'desc' }
    });

    const aggregates = await prisma.opportunity.aggregate({
      _sum: { netProfit: true, grossProfit: true, gasCost: true },
      _avg: { netProfit: true }
    });

    // Last 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24h = await prisma.opportunity.count({
      where: { createdAt: { gte: since24h } }
    });

    res.json({
      total,
      profitable,
      simulated,
      detected,
      last24h,
      successRate: total > 0 ? ((profitable / total) * 100).toFixed(1) : '0.0',
      totalNetProfit: aggregates._sum.netProfit?.toFixed(4) ?? '0',
      totalGrossProfit: aggregates._sum.grossProfit?.toFixed(4) ?? '0',
      totalGasCost: aggregates._sum.gasCost?.toFixed(4) ?? '0',
      avgNetProfit: aggregates._avg.netProfit?.toFixed(4) ?? '0',
      bestNetProfit: bestTrade?.netProfit?.toFixed(4) ?? '0',
      bestRoute: bestTrade?.route ?? 'N/A'
    });
  } catch (err) {
    console.error('[GET /stats]', err);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

// GET /api/chart — time-series data for profit chart
app.get('/api/chart', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string || '6', 10);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const opportunities = await prisma.opportunity.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: {
        createdAt: true,
        netProfit: true,
        grossProfit: true,
        gasCost: true,
        route: true,
        chain: true,
        status: true
      }
    });

    res.json({ data: opportunities });
  } catch (err) {
    console.error('[GET /chart]', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// GET /api/settings
app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await prisma.botSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        minProfitThreshold: 10.0,
        slippageTolerance: 0.5,
        gasMultiplier: 1.1,
        paperTrading: true,
        activeChains: 'arbitrum'
      }
    });
    res.json(settings);
  } catch (err) {
    console.error('[GET /settings]', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
app.put('/api/settings', async (req, res) => {
  try {
    const { minProfitThreshold, slippageTolerance, gasMultiplier, paperTrading, activeChains } = req.body;
    const settings = await prisma.botSettings.upsert({
      where: { id: 'default' },
      update: {
        ...(minProfitThreshold !== undefined && { minProfitThreshold }),
        ...(slippageTolerance !== undefined && { slippageTolerance }),
        ...(gasMultiplier !== undefined && { gasMultiplier }),
        ...(paperTrading !== undefined && { paperTrading }),
        ...(activeChains !== undefined && { activeChains })
      },
      create: {
        minProfitThreshold: minProfitThreshold ?? 10.0,
        slippageTolerance: slippageTolerance ?? 0.5,
        gasMultiplier: gasMultiplier ?? 1.1,
        paperTrading: paperTrading ?? true,
        activeChains: activeChains ?? 'arbitrum'
      }
    });
    // Broadcast settings change to all connected clients
    io.emit('settings:updated', settings);
    res.json(settings);
  } catch (err) {
    console.error('[PUT /settings]', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/pools — active pool configs
app.get('/api/pools', async (req, res) => {
  try {
    const chain = req.query.chain as string | undefined;
    const pools = await prisma.poolConfig.findMany({
      where: { ...(chain ? { chain } : {}), active: true },
      orderBy: [{ chain: 'asc' }, { dex: 'asc' }]
    });
    res.json({ data: pools });
  } catch (err) {
    console.error('[GET /pools]', err);
    res.status(500).json({ error: 'Failed to fetch pools' });
  }
});

// ── Start Server ───────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[API] Server running at http://localhost:${PORT}`);
  console.log(`[API] WebSocket ready for dashboard connections.`);
});

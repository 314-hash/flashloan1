'use client';

import type { Stats } from '@/hooks/useOpportunities';

interface StatsBarProps {
  stats: Stats | null;
  isConnected: boolean;
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
  negative = false
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  negative?: boolean;
}) {
  const valueColor = negative
    ? 'text-rose-400'
    : accent
    ? 'neon-text'
    : 'text-slate-100';

  return (
    <div className="glass-card p-5 flex flex-col gap-1 min-w-0">
      <span className="text-xs font-semibold tracking-widest uppercase text-slate-500">{label}</span>
      <span className={`stat-value ${valueColor}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500 mt-1">{sub}</span>}
    </div>
  );
}

export default function StatsBar({ stats, isConnected }: StatsBarProps) {
  const totalNetProfitNum = parseFloat(stats?.totalNetProfit ?? '0');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">
          ⚡ FlashLoan<span className="neon-text"> AI</span>
          <span className="text-slate-500 font-normal text-sm ml-2">Arbitrage Dashboard</span>
        </h1>
        <div className="live-indicator">
          <div className={`live-dot ${isConnected ? '' : 'bg-rose-400'}`} />
          <span className={`text-xs font-semibold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard
          label="Total Scans"
          value={stats?.total?.toLocaleString() ?? '–'}
          sub="all time"
        />
        <StatCard
          label="Last 24h"
          value={stats?.last24h?.toLocaleString() ?? '–'}
          sub="opportunities"
        />
        <StatCard
          label="Detected"
          value={stats?.detected?.toLocaleString() ?? '–'}
          sub="above threshold"
          accent
        />
        <StatCard
          label="Success Rate"
          value={`${stats?.successRate ?? '0'}%`}
          sub="profitable trades"
          accent={parseFloat(stats?.successRate ?? '0') > 50}
        />
        <StatCard
          label="Net Profit"
          value={`$${Math.abs(totalNetProfitNum).toFixed(2)}`}
          sub="cumulative USD"
          accent={totalNetProfitNum > 0}
          negative={totalNetProfitNum < 0}
        />
        <StatCard
          label="Best Trade"
          value={`$${stats?.bestNetProfit ?? '0'}`}
          sub={stats?.bestRoute?.split(' -> ').slice(0, 2).join('→') ?? '–'}
          accent
        />
        <StatCard
          label="Avg Net"
          value={`$${stats?.avgNetProfit ?? '0'}`}
          sub="per scan"
        />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Opportunity } from '@/hooks/useOpportunities';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
}

const CHAINS: Record<string, string> = {
  ethereum: '⟠',
  arbitrum: '🔵',
  polygon: '🟣',
  base: '🔷',
  optimism: '🔴'
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'DETECTED'
      ? 'badge-detected'
      : status === 'SUCCESS'
      ? 'badge-success'
      : status === 'FAILED'
      ? 'badge-failed'
      : 'badge-simulated';
  return <span className={`badge ${cls}`}>{status}</span>;
}

function ProfitCell({ value }: { value: number }) {
  const cls = value > 0 ? 'text-profit font-semibold' : value < -1 ? 'text-loss' : 'text-neutral';
  return <span className={`font-mono text-xs ${cls}`}>${value.toFixed(4)}</span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function OpportunitiesTable({ opportunities }: OpportunitiesTableProps) {
  const [filter, setFilter] = useState<'ALL' | 'DETECTED' | 'SIMULATED'>('ALL');
  const [chainFilter, setChainFilter] = useState<string>('ALL');

  const chains = ['ALL', ...Array.from(new Set(opportunities.map((o) => o.chain)))];

  const filtered = opportunities.filter((o) => {
    if (filter !== 'ALL' && o.status !== filter) return false;
    if (chainFilter !== 'ALL' && o.chain !== chainFilter) return false;
    return true;
  });

  return (
    <div className="glass-card p-4 flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
          Opportunity Feed
          <span className="ml-2 text-xs text-slate-500 normal-case font-normal">
            ({filtered.length} results)
          </span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {/* Status filters */}
          {(['ALL', 'DETECTED', 'SIMULATED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
                filter === f
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-navy-700 text-slate-400 hover:text-slate-200'
              }`}
              style={{ background: filter === f ? undefined : 'rgba(15,32,64,0.8)' }}
            >
              {f}
            </button>
          ))}
          {/* Chain filters */}
          <select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="input-dark text-xs py-1 px-2"
            style={{ width: 'auto' }}
          >
            {chains.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Chains' : `${CHAINS[c] ?? ''} ${c}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1" style={{ maxHeight: '380px' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
            <span className="text-3xl mb-2">📡</span>
            Waiting for scanner data…
          </div>
        ) : (
          <table className="data-table">
            <thead className="sticky top-0" style={{ background: 'rgba(10,22,40,0.95)' }}>
              <tr>
                <th>Time</th>
                <th>Chain</th>
                <th>Route</th>
                <th>Gross</th>
                <th>Gas</th>
                <th>Net</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((op) => (
                <tr key={op.id} className="transition-colors">
                  <td className="font-mono text-xs text-slate-500">{timeAgo(op.createdAt)}</td>
                  <td className="text-xs">
                    <span className="mr-1">{CHAINS[op.chain] ?? '🔗'}</span>
                    <span className="text-slate-400 capitalize">{op.chain}</span>
                  </td>
                  <td className="font-mono text-xs text-slate-300 max-w-xs truncate" title={op.route}>
                    {op.route.replace(/ -> /g, ' → ')}
                  </td>
                  <td><ProfitCell value={op.grossProfit} /></td>
                  <td>
                    <span className="font-mono text-xs text-amber-500">${op.gasCost.toFixed(4)}</span>
                  </td>
                  <td><ProfitCell value={op.netProfit} /></td>
                  <td><StatusBadge status={op.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

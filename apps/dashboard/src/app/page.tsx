'use client';

import { useEffect, useRef, useState } from 'react';
import { useOpportunities, type Opportunity } from '@/hooks/useOpportunities';
import { useSocket } from '@/hooks/useSocket';
import StatsBar from '@/components/StatsBar';
import OpportunitiesTable from '@/components/OpportunitiesTable';
import ProfitChart from '@/components/ProfitChart';
import SettingsPanel from '@/components/SettingsPanel';
import LiveFeed from '@/components/LiveFeed';

export default function DashboardPage() {
  const {
    opportunities,
    stats,
    settings,
    chartData,
    loading,
    error,
    addOpportunity,
    updateSettings
  } = useOpportunities(8000);

  const { socket, isConnected } = useSocket();
  const [latestOp, setLatestOp] = useState<Opportunity | null>(null);

  // Wire up Socket.IO events
  useEffect(() => {
    if (!socket) return;

    const handleNew = (op: Opportunity) => {
      addOpportunity(op);
      setLatestOp(op);
    };

    socket.on('opportunity:new', handleNew);
    return () => { socket.off('opportunity:new', handleNew); };
  }, [socket, addOpportunity]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl animate-pulse">⚡</div>
        <div className="neon-text font-bold text-lg tracking-wider">Connecting to Flash Loan AI…</div>
        <div className="text-slate-500 text-sm">Fetching live arbitrage data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-5">
      {/* API Error Banner */}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.25)',
            color: '#fb7185'
          }}
        >
          <span>⚠️</span>
          <span>
            <strong>API Connection Error:</strong> {error} — Make sure{' '}
            <code className="font-mono text-xs bg-red-900/30 px-1 rounded">
              npm run dev:api
            </code>{' '}
            is running.
          </span>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={stats} isConnected={isConnected} />

      {/* Profit Chart — full width */}
      <ProfitChart data={chartData} />

      {/* Bottom Grid: Table + Right Column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Opportunities Table — takes 2/3 width */}
        <div className="xl:col-span-2">
          <OpportunitiesTable opportunities={opportunities} />
        </div>

        {/* Right column: Live Feed + Settings */}
        <div className="flex flex-col gap-5">
          <LiveFeed latestOp={latestOp} />
          <SettingsPanel settings={settings} onUpdate={updateSettings} />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-600 pb-4">
        FlashLoan AI • Paper Trading Mode •{' '}
        <span className={isConnected ? 'text-emerald-600' : 'text-rose-600'}>
          {isConnected ? '🟢 Live' : '🔴 Disconnected'}
        </span>
        {' '}• Scans every 5s on Arbitrum
      </div>
    </div>
  );
}

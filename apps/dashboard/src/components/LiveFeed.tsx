'use client';

import { useEffect, useRef, useState } from 'react';
import type { Opportunity } from '@/hooks/useOpportunities';

interface LiveFeedProps {
  latestOp: Opportunity | null;
}

interface FeedItem extends Opportunity {
  isNew?: boolean;
}

const CHAIN_ICON: Record<string, string> = {
  ethereum: '⟠',
  arbitrum: '🔵',
  polygon: '🟣',
  base: '🔷',
  optimism: '🔴'
};

function timeStr(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function LiveFeed({ latestOp }: LiveFeedProps) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!latestOp || seenIds.current.has(latestOp.id)) return;
    seenIds.current.add(latestOp.id);

    setFeed((prev) => {
      const item: FeedItem = { ...latestOp, isNew: true };
      return [item, ...prev].slice(0, 80);
    });

    // Remove isNew flag after animation
    setTimeout(() => {
      setFeed((prev) =>
        prev.map((i) => (i.id === latestOp.id ? { ...i, isNew: false } : i))
      );
    }, 1400);
  }, [latestOp]);

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
          Live Event Feed
        </h2>
        <span className="text-xs text-slate-500">{feed.length} events</span>
      </div>

      <div
        ref={listRef}
        className="overflow-y-auto space-y-1.5"
        style={{ maxHeight: 320 }}
      >
        {feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-600 text-sm">
            <span className="text-2xl mb-2">📡</span>
            Listening for events…
          </div>
        ) : (
          feed.map((item) => {
            const netColor =
              item.netProfit > 0
                ? 'text-emerald-400'
                : item.netProfit > -2
                ? 'text-slate-400'
                : 'text-rose-400';
            return (
              <div
                key={item.id}
                className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
                  item.isNew ? 'flash-new' : ''
                }`}
              >
                {/* Icon */}
                <span className="text-base leading-tight mt-0.5">
                  {CHAIN_ICON[item.chain] ?? '🔗'}
                </span>
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-slate-300 truncate">
                      {item.route.replace(/ -> /g, ' → ')}
                    </span>
                    <span className={`font-mono font-bold shrink-0 ${netColor}`}>
                      {item.netProfit >= 0 ? '+' : ''}${item.netProfit.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-slate-600">
                    <span>{item.chain}</span>
                    <span>·</span>
                    <span>{item.status}</span>
                    <span>·</span>
                    <span>{timeStr(item.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

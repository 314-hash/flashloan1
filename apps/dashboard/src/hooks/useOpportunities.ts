'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface Opportunity {
  id: string;
  createdAt: string;
  chain: string;
  route: string;
  grossProfit: number;
  gasCost: number;
  netProfit: number;
  status: string;
  txHash?: string;
  details?: Record<string, unknown>;
}

export interface Stats {
  total: number;
  profitable: number;
  simulated: number;
  detected: number;
  last24h: number;
  successRate: string;
  totalNetProfit: string;
  totalGrossProfit: string;
  totalGasCost: string;
  avgNetProfit: string;
  bestNetProfit: string;
  bestRoute: string;
}

export interface BotSettings {
  id: string;
  minProfitThreshold: number;
  slippageTolerance: number;
  gasMultiplier: number;
  paperTrading: boolean;
  activeChains: string;
}

export interface ChartPoint {
  createdAt: string;
  netProfit: number;
  grossProfit: number;
  gasCost: number;
  route: string;
  chain: string;
  status: string;
}

export function useOpportunities(pollInterval = 5000) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [opsRes, statsRes, settingsRes, chartRes] = await Promise.all([
        fetch(`${API_URL}/api/opportunities?limit=100`),
        fetch(`${API_URL}/api/stats`),
        fetch(`${API_URL}/api/settings`),
        fetch(`${API_URL}/api/chart?hours=6`)
      ]);

      if (!opsRes.ok || !statsRes.ok) throw new Error('API fetch failed');

      const opsJson = await opsRes.json();
      const statsJson = await statsRes.json();
      const settingsJson = await settingsRes.json();
      const chartJson = await chartRes.json();

      setOpportunities(opsJson.data ?? []);
      setStats(statsJson);
      setSettings(settingsJson);
      setChartData(chartJson.data ?? []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Prepend a new opportunity received via socket without refetching
  const addOpportunity = useCallback((op: Opportunity) => {
    setOpportunities((prev) => [op, ...prev].slice(0, 200));
    setChartData((prev) => [
      ...prev,
      {
        createdAt: op.createdAt,
        netProfit: op.netProfit,
        grossProfit: op.grossProfit,
        gasCost: op.gasCost,
        route: op.route,
        chain: op.chain,
        status: op.status
      }
    ]);
  }, []);

  const updateSettings = useCallback(async (updates: Partial<BotSettings>) => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updated = await res.json();
      setSettings(updated);
      return updated;
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchAll();
    timerRef.current = setInterval(fetchAll, pollInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll, pollInterval]);

  return { opportunities, stats, settings, chartData, loading, error, addOpportunity, updateSettings, refetch: fetchAll };
}

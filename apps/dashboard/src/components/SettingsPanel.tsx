'use client';

import { useState } from 'react';
import type { BotSettings } from '@/hooks/useOpportunities';

interface SettingsPanelProps {
  settings: BotSettings | null;
  onUpdate: (updates: Partial<BotSettings>) => Promise<void>;
}

export default function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const [local, setLocal] = useState<Partial<BotSettings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const get = <K extends keyof BotSettings>(key: K): BotSettings[K] | undefined =>
    (local[key] !== undefined ? local[key] : settings?.[key]) as BotSettings[K] | undefined;

  const set = <K extends keyof BotSettings>(key: K, value: BotSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(local);
      setLocal({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(local).length > 0;

  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Bot Settings</h2>
        {settings?.paperTrading && (
          <span className="badge badge-simulated">Paper Mode</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Paper Trading Toggle */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <div className="text-sm font-medium text-slate-300">Paper Trading</div>
            <div className="text-xs text-slate-500 mt-0.5">Simulate without real execution</div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={get('paperTrading') ?? true}
              onChange={(e) => set('paperTrading', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Min Profit Threshold */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Min Profit Threshold
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input
              type="number"
              className="input-dark pl-6"
              value={get('minProfitThreshold') ?? 10}
              step="0.5"
              min="0"
              onChange={(e) => set('minProfitThreshold', parseFloat(e.target.value))}
            />
          </div>
          <span className="text-xs text-slate-500">Minimum net USD profit to flag as DETECTED</span>
        </div>

        {/* Slippage Tolerance */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Slippage Tolerance
          </label>
          <div className="relative">
            <input
              type="number"
              className="input-dark pr-6"
              value={get('slippageTolerance') ?? 0.5}
              step="0.1"
              min="0"
              max="5"
              onChange={(e) => set('slippageTolerance', parseFloat(e.target.value))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
          </div>
          <span className="text-xs text-slate-500">Max acceptable slippage per swap</span>
        </div>

        {/* Gas Multiplier */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Gas Multiplier
          </label>
          <input
            type="number"
            className="input-dark"
            value={get('gasMultiplier') ?? 1.1}
            step="0.05"
            min="1"
            max="3"
            onChange={(e) => set('gasMultiplier', parseFloat(e.target.value))}
          />
          <span className="text-xs text-slate-500">Safety buffer for gas estimation (1.1 = +10%)</span>
        </div>

        {/* Active Chains */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Active Chains
          </label>
          <input
            type="text"
            className="input-dark"
            value={get('activeChains') ?? 'arbitrum'}
            placeholder="ethereum,arbitrum,polygon"
            onChange={(e) => set('activeChains', e.target.value)}
          />
          <span className="text-xs text-slate-500">Comma-separated chain names</span>
        </div>
      </div>

      {/* Save Button */}
      <button
        className="btn-primary w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSave}
        disabled={!hasChanges || saving}
      >
        {saving ? '⏳ Saving…' : saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

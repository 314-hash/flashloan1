'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import type { ChartPoint } from '@/hooks/useOpportunities';

interface ProfitChartProps {
  data: ChartPoint[];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass-card p-3 text-xs space-y-1"
      style={{ border: '1px solid rgba(16,185,129,0.3)', minWidth: 160 }}
    >
      <div className="text-slate-400 font-mono mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>
            ${Number(p.value).toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProfitChart({ data }: ProfitChartProps) {
  const chartData = data.map((d) => ({
    time: formatTime(d.createdAt),
    'Net Profit': parseFloat(d.netProfit.toFixed(4)),
    'Gross Profit': parseFloat(d.grossProfit.toFixed(4)),
    'Gas Cost': parseFloat((-d.gasCost).toFixed(4))
  }));

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
          Profit Chart
          <span className="ml-2 text-xs text-slate-500 normal-case font-normal">last 6 hours</span>
        </h2>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-emerald-400 rounded" />
            Net
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-blue-400 rounded" />
            Gross
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-rose-400 rounded" />
            Gas
          </span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
          <span className="text-3xl mb-2">📈</span>
          No data yet — scanner running…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.06)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.2)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="Net Profit"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', stroke: '#050d1a', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Gross Profit"
              stroke="#60a5fa"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              activeDot={{ r: 3, fill: '#60a5fa' }}
            />
            <Line
              type="monotone"
              dataKey="Gas Cost"
              stroke="#f43f5e"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              activeDot={{ r: 3, fill: '#f43f5e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar, Compass, Activity, Layers } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { useTrades } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import {
  groupByPair, groupByDayOfWeek, groupByDirection, groupBySession, groupByStrategy,
  computeDashboardStats, formatCurrency, formatPercent,
} from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { StatCard } from '@/components/ui/StatCard';
import { StrategyEdgeScore } from '@/components/StrategyEdgeScore';

export function AnalyticsPage() {
  const { user } = useAuth();
  const { trades, loading } = useTrades(user?.id);

  const pairData = useMemo(() => groupByPair(trades), [trades]);
  const dayData = useMemo(() => groupByDayOfWeek(trades), [trades]);
  const dirData = useMemo(() => groupByDirection(trades), [trades]);
  const sessionData = useMemo(() => groupBySession(trades), [trades]);
  const strategyData = useMemo(() => groupByStrategy(trades), [trades]);
  const stats = useMemo(() => computeDashboardStats(trades), [trades]);

  const tooltipStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 12,
  };

  if (loading) return <LoadingSpinner label="Loading analytics..." />;

  if (trades.length === 0) {
    return (
      <div>
        <SectionHeader title="Analytics" subtitle="Deep performance insights across your trading" />
        <div className="card p-8">
          <EmptyState icon={<BarChart3 size={40} />} title="No data to analyze yet" message="Add some trades and your performance analytics will appear here — by pair, day, direction, session, and strategy." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Deep performance insights across your trading" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Trades" value={String(stats.totalTrades)} icon={<Activity size={20} className="text-brand-500" />} />
        <StatCard label="Win Rate" value={formatPercent(stats.winRate)} icon={<TrendingUp size={20} className="text-accent-500" />} />
        <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} icon={<BarChart3 size={20} className="text-brand-500" />} />
        <StatCard label="Expectancy" value={formatCurrency(stats.expectancy)} icon={<TrendingUp size={20} className="text-success-500" />} />
      </div>

      {/* By Pair */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Layers size={16} className="text-brand-500" /> Performance by Currency Pair</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pairData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
            <XAxis dataKey="pair" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(Number(v)), 'P&L']} />
            <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
              {pairData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {pairData.map(p => (
            <div key={p.pair} className="p-2 rounded-lg bg-secondary border border-themed">
              <p className="font-mono text-xs font-semibold">{p.pair}</p>
              <p className="text-xs text-muted">{p.trades} trades · {formatPercent(p.winRate)} WR</p>
              <p className={`text-xs font-mono font-semibold ${p.pnl >= 0 ? 'text-success-500' : 'text-error-500'}`}>{formatCurrency(p.pnl)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* By Day of Week */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Calendar size={16} className="text-brand-500" /> Performance by Day of Week</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dayData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, _n: any, p: any) => [formatCurrency(Number(v)), `${(p.payload as any).trades} trades`]} />
            <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
              {dayData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By Direction + By Session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Compass size={16} className="text-brand-500" /> Win Rate by Direction</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={dirData} dataKey="trades" nameKey="direction" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                {dirData.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--brand)' : 'var(--accent)'} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: any) => [`${v} trades`, n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {dirData.map(d => (
              <div key={d.direction} className="flex items-center justify-between text-sm">
                <span className="font-medium">{d.direction}</span>
                <span className="text-muted">{d.trades} trades · {formatPercent(d.winRate)} WR · <span className={d.pnl >= 0 ? 'text-success-500' : 'text-error-500'}>{formatCurrency(d.pnl)}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Activity size={16} className="text-brand-500" /> Performance by Session</h3>
          {sessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={sessionData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="session" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <PolarRadiusAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                <Radar name="P&L" dataKey="pnl" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.3} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [formatCurrency(Number(v)), 'P&L']} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<Calendar size={32} />} title="No session data" message="Tag your trades with a session to see this analysis." />
          )}
        </div>
      </div>

      {/* By Strategy */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Layers size={16} className="text-brand-500" /> Performance by Strategy</h3>
        {strategyData.length > 0 ? (
          <div className="space-y-2">
            {strategyData.map(s => (
              <div key={s.strategy} className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-themed">
                <div>
                  <span className="font-semibold text-sm">{s.strategy}</span>
                  <span className="ml-2 text-xs text-muted">{s.trades} trades · {formatPercent(s.winRate)} WR</span>
                </div>
                <span className={`font-mono font-semibold text-sm ${s.pnl >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                  {formatCurrency(s.pnl)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Layers size={32} />} title="No strategy data" message="Tag your trades with a strategy to see which ones perform best." />
        )}
      </div>

      <div className="mt-6">
        <StrategyEdgeScore trades={trades} />
      </div>
    </div>
  );
}

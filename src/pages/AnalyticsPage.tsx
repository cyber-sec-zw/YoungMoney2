import { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Compass, Activity, Layers } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { useTrades, useTradingAccounts } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import {
  groupByPair, groupByDayOfWeek, groupByDirection, groupBySession, groupByStrategy,
  computeDashboardStats, formatPercent,
} from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import { StatCard } from '@/components/ui/StatCard';
import { StrategyEdgeScore } from '@/components/StrategyEdgeScore';

export function AnalyticsPage() {
  const { user } = useAuth();
  const { trades, loading } = useTrades(user?.id);
  const { accounts, loading: accountsLoading } = useTradingAccounts(user?.id);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const defaultAccount = accounts.find(account => account.is_active) || accounts[0] || null;
  const accountId = selectedAccountId === '__unassigned__' ? '' : selectedAccountId ?? defaultAccount?.id ?? '';
  const selectedAccount = accounts.find(account => account.id === accountId) || null;
  const currency = selectedAccount?.base_currency || 'USD';
  const accountTrades = useMemo(() => accountId
    ? trades.filter(trade => trade.account_id === accountId)
    : trades.filter(trade => !trade.account_id), [trades, accountId]);
  const closedTrades = useMemo(() => accountTrades.filter(trade => trade.status === 'closed'), [accountTrades]);
  const formatMoney = (value: number) => new Intl.NumberFormat(undefined, {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(value);

  const pairData = useMemo(() => groupByPair(closedTrades), [closedTrades]);
  const dayData = useMemo(() => groupByDayOfWeek(closedTrades), [closedTrades]);
  const dirData = useMemo(() => groupByDirection(closedTrades), [closedTrades]);
  const sessionData = useMemo(() => groupBySession(closedTrades), [closedTrades]);
  const strategyData = useMemo(() => groupByStrategy(closedTrades), [closedTrades]);
  const stats = useMemo(() => computeDashboardStats(closedTrades), [closedTrades]);

  const tooltipStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 12,
  };

  if (loading || accountsLoading) return <LoadingSpinner label="Loading analytics..." />;

  if (closedTrades.length === 0) {
    return (
      <div>
        <SectionHeader title="Analytics" subtitle="Deep performance insights across your trading" />
        <label className="mb-5 block max-w-sm text-xs font-semibold text-secondary">Account view
          <select className="input-field mt-1.5" value={selectedAccountId ?? accountId} onChange={event => setSelectedAccountId(event.target.value || '__unassigned__')}>
            {accounts.map(account => <option key={account.id} value={account.id}>{account.name} · {account.base_currency}</option>)}
            <option value="__unassigned__">Unassigned legacy trades (assumed USD)</option>
          </select>
        </label>
        <div className="card p-8">
          <EmptyState icon={<BarChart3 size={40} />} title="No closed trades in this account" message="Choose another account or close/log trades to see realized performance." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Deep performance insights across your trading" />
      <label className="mb-5 block max-w-sm text-xs font-semibold text-secondary">Account view
        <select className="input-field mt-1.5" value={selectedAccountId ?? accountId} onChange={event => setSelectedAccountId(event.target.value || '__unassigned__')}>
          {accounts.map(account => <option key={account.id} value={account.id}>{account.name} · {account.base_currency}</option>)}
          <option value="__unassigned__">Unassigned legacy trades (assumed USD)</option>
        </select>
      </label>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Trades" value={String(stats.totalTrades)} icon={<Activity size={20} className="text-brand-500" />} />
        <StatCard label="Win Rate" value={formatPercent(stats.winRate)} icon={<TrendingUp size={20} className="text-accent-500" />} />
        <StatCard label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} icon={<BarChart3 size={20} className="text-brand-500" />} />
        <StatCard label="Expectancy" value={formatMoney(stats.expectancy)} icon={<TrendingUp size={20} className="text-success-500" />} />
      </div>

      {/* By Pair */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Layers size={16} className="text-brand-500" /> Performance by Currency Pair</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pairData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
            <XAxis dataKey="pair" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => formatMoney(Number(v))} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMoney(Number(v)), 'P&L']} />
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
              <p className={`text-xs font-mono font-semibold ${p.pnl >= 0 ? 'text-success-500' : 'text-error-500'}`}>{formatMoney(p.pnl)}</p>
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
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => formatMoney(Number(v))} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMoney(Number(v)), 'P&L']} />
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
              <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} trades`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {dirData.map(d => (
              <div key={d.direction} className="flex items-center justify-between text-sm">
                <span className="font-medium">{d.direction}</span>
                <span className="text-muted">{d.trades} trades · {formatPercent(d.winRate)} WR · <span className={d.pnl >= 0 ? 'text-success-500' : 'text-error-500'}>{formatMoney(d.pnl)}</span></span>
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
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMoney(Number(v)), 'P&L']} />
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
                  {formatMoney(s.pnl)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Layers size={32} />} title="No strategy data" message="Tag your trades with a strategy to see which ones perform best." />
        )}
      </div>

      <div className="mt-6">
        <StrategyEdgeScore trades={closedTrades} />
      </div>
    </div>
  );
}

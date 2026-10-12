import { useMemo } from 'react';
import { Shield, AlertTriangle, TrendingDown, Activity, Gauge, Target, Zap, AlertOctagon } from 'lucide-react';
import type { Trade, RiskSettings } from '@/lib/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';

interface RiskGuardianProps {
  trades: Trade[];
  settings: RiskSettings | null;
  onConfigure: () => void;
}

export function RiskGuardian({ trades, settings, onConfigure }: RiskGuardianProps) {
  const riskData = useMemo(() => {
    const today = new Date();
    const todayTrades = trades.filter(t => {
      if (t.status !== 'closed') return false;
      return isToday(parseISO(t.entry_time));
    });

    const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
    const todayTradeCount = todayTrades.length;

    // All trades today including open ones for trade count
    const allTodayTrades = trades.filter(t => isToday(parseISO(t.entry_time)));
    const todayTradeCountAll = allTodayTrades.length;

    const balance = settings?.account_balance ?? 10000;
    const maxDailyLossPct = settings?.max_daily_loss_pct ?? 3.0;
    const maxDailyTrades = settings?.max_daily_trades ?? 5;
    const maxRiskPerTrade = settings?.max_risk_per_trade_pct ?? 1.0;
    const maxDrawdownPct = settings?.max_drawdown_pct ?? 10.0;
    const dailyLossLimitAmount = settings?.daily_loss_limit_amount;

    const dailyLossLimitDollar = dailyLossLimitAmount ?? (balance * maxDailyLossPct / 100);
    const dailyLossUsed = Math.abs(Math.min(todayPnl, 0));
    const dailyLossRemaining = dailyLossLimitDollar - dailyLossUsed;
    const dailyLossPctUsed = dailyLossLimitDollar > 0 ? (dailyLossUsed / dailyLossLimitDollar) * 100 : 0;

    // Drawdown calculation
    const sorted = [...trades]
      .filter(t => t.status === 'closed')
      .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime());

    let running = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    sorted.forEach(t => {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDrawdown) maxDrawdown = dd;
      currentDrawdown = peak - running;
    });
    const computedMaxDrawdownPct = balance > 0 ? (maxDrawdown / balance) * 100 : 0;
    const currentDrawdownPct = balance > 0 ? (currentDrawdown / balance) * 100 : 0;

    // Risk per trade from today's trades
    const todayRiskPcts = todayTrades
      .filter(t => t.risk_percent != null)
      .map(t => t.risk_percent as number);
    const maxRiskUsedToday = todayRiskPcts.length > 0 ? Math.max(...todayRiskPcts) : 0;

    // Status determination
    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (dailyLossPctUsed >= 100 || todayTradeCountAll >= maxDailyTrades) {
      status = 'danger';
    } else if (dailyLossPctUsed >= 70 || todayTradeCountAll >= maxDailyTrades - 1 || currentDrawdownPct >= maxDrawdownPct * 0.8) {
      status = 'warning';
    }

    return {
      todayPnl,
      todayTradeCount: todayTradeCountAll,
      maxDailyTrades,
      dailyLossLimitDollar,
      dailyLossUsed,
      dailyLossRemaining,
      dailyLossPctUsed,
      maxRiskPerTrade,
      maxRiskUsedToday,
      maxDrawdown,
      maxDrawdownPct: computedMaxDrawdownPct,
      currentDrawdown,
      currentDrawdownPct,
      maxDrawdownPctLimit: maxDrawdownPct,
      status,
      balance,
    };
  }, [trades, settings]);

  const statusConfig = {
    safe: {
      color: 'text-success-500',
      bg: 'bg-success-500/5',
      border: 'border-success-500/20',
      barColor: 'bg-success-500',
      icon: Shield,
      label: 'Within Limits',
    },
    warning: {
      color: 'text-warning-500',
      bg: 'bg-warning-500/5',
      border: 'border-warning-500/20',
      barColor: 'bg-warning-500',
      icon: AlertTriangle,
      label: 'Approaching Limits',
    },
    danger: {
      color: 'text-error-500',
      bg: 'bg-error-500/5',
      border: 'border-error-500/20',
      barColor: 'bg-error-500',
      icon: AlertOctagon,
      label: 'Limit Reached — Stop Trading',
    },
  };

  const cfg = statusConfig[riskData.status];
  const StatusIcon = cfg.icon;

  return (
    <div className={`card p-5 border ${cfg.border} ${cfg.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${cfg.bg} ${cfg.border} border`}>
            <Shield size={18} className={cfg.color} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Risk Guardian</h3>
            <p className="text-[11px] text-muted">Daily loss limits & drawdown protection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${riskData.status === 'safe' ? 'badge-success' : riskData.status === 'warning' ? 'badge-warning' : 'badge-error'}`}>
            <StatusIcon size={12} />
            {cfg.label}
          </span>
          <button onClick={onConfigure} className="btn-ghost text-xs px-2 py-1">
            <Gauge size={14} /> Settings
          </button>
        </div>
      </div>

      {/* Danger alert */}
      {riskData.status === 'danger' && (
        <div className="mb-4 p-3 rounded-xl bg-error-500/10 border border-error-500/30 flex items-start gap-2.5 animate-slide-up">
          <AlertOctagon size={18} className="text-error-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-error-500">
              {riskData.dailyLossPctUsed >= 100 ? 'Daily loss limit reached' : 'Daily trade limit reached'}
            </p>
            <p className="text-xs text-secondary mt-0.5">
              You've hit your configured limit. The best traders know when to stop. Consider stepping away and reviewing your trades tomorrow.
            </p>
          </div>
        </div>
      )}

      {/* Daily Loss Meter */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingDown size={15} className="text-muted" />
            <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Daily Loss Limit</span>
          </div>
          <span className="text-xs font-mono font-bold">
            {formatCurrency(riskData.dailyLossUsed)} / {formatCurrency(riskData.dailyLossLimitDollar)}
          </span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ${cfg.barColor}`}
            style={{ width: `${Math.min(riskData.dailyLossPctUsed, 100)}%` }}
          />
          {/* Threshold markers */}
          <div className="absolute top-0 bottom-0 w-px bg-warning-500/40" style={{ left: '70%' }} />
          <div className="absolute top-0 bottom-0 w-px bg-error-500/40" style={{ left: '100%' }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className={`text-xs font-semibold ${riskData.dailyLossRemaining > 0 ? 'text-success-500' : 'text-error-500'}`}>
            {riskData.dailyLossRemaining > 0
              ? `${formatCurrency(riskData.dailyLossRemaining)} remaining today`
              : 'Limit exceeded'}
          </span>
          <span className="text-xs text-muted">{formatPercent(riskData.dailyLossPctUsed)} used</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Trades today */}
        <div className="p-3 rounded-xl bg-secondary border border-themed">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity size={13} className="text-muted" />
            <span className="text-[10px] font-semibold text-muted uppercase">Trades Today</span>
          </div>
          <p className="text-lg font-bold font-mono">
            {riskData.todayTradeCount}
            <span className="text-xs text-muted"> / {riskData.maxDailyTrades}</span>
          </p>
          <div className="h-1 rounded-full bg-secondary mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${riskData.todayTradeCount >= riskData.maxDailyTrades ? 'bg-error-500' : riskData.todayTradeCount >= riskData.maxDailyTrades - 1 ? 'bg-warning-500' : 'bg-brand-500'}`}
              style={{ width: `${Math.min((riskData.todayTradeCount / riskData.maxDailyTrades) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Today P&L */}
        <div className="p-3 rounded-xl bg-secondary border border-themed">
          <div className="flex items-center gap-1.5 mb-1">
            <Target size={13} className="text-muted" />
            <span className="text-[10px] font-semibold text-muted uppercase">Today P&L</span>
          </div>
          <p className={`text-lg font-bold font-mono ${riskData.todayPnl >= 0 ? 'text-success-500' : 'text-error-500'}`}>
            {formatCurrency(riskData.todayPnl)}
          </p>
        </div>

        {/* Max risk per trade */}
        <div className="p-3 rounded-xl bg-secondary border border-themed">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={13} className="text-muted" />
            <span className="text-[10px] font-semibold text-muted uppercase">Max Risk / Trade</span>
          </div>
          <p className="text-lg font-bold font-mono">
            {formatPercent(riskData.maxRiskPerTrade)}
          </p>
          <p className={`text-[10px] mt-0.5 ${riskData.maxRiskUsedToday > riskData.maxRiskPerTrade ? 'text-error-500 font-semibold' : 'text-muted'}`}>
            {riskData.maxRiskUsedToday > 0 ? `Today max: ${formatPercent(riskData.maxRiskUsedToday)}` : 'No risk data today'}
          </p>
        </div>

        {/* Current drawdown */}
        <div className="p-3 rounded-xl bg-secondary border border-themed">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={13} className="text-muted" />
            <span className="text-[10px] font-semibold text-muted uppercase">Drawdown</span>
          </div>
          <p className={`text-lg font-bold font-mono ${riskData.currentDrawdownPct >= riskData.maxDrawdownPctLimit * 0.8 ? 'text-error-500' : riskData.currentDrawdownPct > 0 ? 'text-warning-500' : 'text-success-500'}`}>
            {formatPercent(riskData.currentDrawdownPct)}
          </p>
          <p className="text-[10px] text-muted mt-0.5">
            Max: {formatPercent(riskData.maxDrawdownPct)} · Limit: {formatPercent(riskData.maxDrawdownPctLimit)}
          </p>
        </div>
      </div>

      {/* Today's date */}
      <p className="mt-4 text-[10px] text-muted text-center">
        {format(new Date(), 'EEEE, MMMM d, yyyy')}
      </p>
    </div>
  );
}

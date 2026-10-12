import { useMemo } from 'react';
import { Award, TrendingUp, TrendingDown, Target, Zap, Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import type { Trade } from '@/lib/types';
import { scoreAllStrategies, type StrategyScore } from '@/lib/strategyScore';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { EmptyState } from '@/components/ui/Feedback';

const EDGE_STYLES: Record<StrategyScore['edgeRating'], { bar: string; text: string; bg: string; border: string }> = {
  elite: { bar: 'bg-success-500', text: 'text-success-500', bg: 'bg-success-500/10', border: 'border-success-500/20' },
  strong: { bar: 'bg-brand-500', text: 'text-brand-500', bg: 'bg-brand-500/10', border: 'border-brand-500/20' },
  developing: { bar: 'bg-warning-500', text: 'text-warning-500', bg: 'bg-warning-500/10', border: 'border-warning-500/20' },
  weak: { bar: 'bg-error-500', text: 'text-error-500', bg: 'bg-error-500/10', border: 'border-error-500/20' },
  untested: { bar: 'bg-muted', text: 'text-muted', bg: 'bg-secondary', border: 'border-themed' },
};

function gradeGradient(grade: string): string {
  if (grade.startsWith('A')) return 'from-success-500 to-success-700';
  if (grade.startsWith('B')) return 'from-brand-500 to-brand-700';
  if (grade.startsWith('C')) return 'from-warning-500 to-warning-700';
  return 'from-error-500 to-error-700';
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted">{icon}</span>
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs font-mono font-semibold ${tone === 'pos' ? 'text-success-500' : tone === 'neg' ? 'text-error-500' : 'text-secondary'}`}>{value}</span>
    </div>
  );
}

export function StrategyEdgeScore({ trades }: { trades: Trade[] }) {
  const scores = useMemo(() => scoreAllStrategies(trades).filter(s => s.totalTrades >= 1), [trades]);

  const overall = useMemo(() => {
    if (scores.length === 0) return 0;
    const totalTrades = scores.reduce((s, sc) => s + sc.totalTrades, 0);
    if (totalTrades === 0) return 0;
    return Math.round(scores.reduce((s, sc) => s + sc.score * sc.totalTrades, 0) / totalTrades);
  }, [scores]);

  if (scores.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Award size={16} className="text-brand-500" /> Strategy Edge Scores
        </h3>
        <EmptyState icon={<Award size={36} />} title="No strategy data" message="Tag your trades with a strategy to see which ones have a real edge." />
      </div>
    );
  }

  const gaugeColor = overall >= 75 ? '#10b981' : overall >= 55 ? 'var(--brand)' : overall >= 35 ? 'var(--accent)' : '#ef4444';
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (overall / 100) * circumference;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Award size={16} className="text-brand-500" /> Strategy Edge Scores
      </h3>

      <div className="flex flex-col items-center mb-6 pb-5 border-b border-themed">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono" style={{ color: gaugeColor }}>{overall}</span>
            <span className="text-[10px] text-muted uppercase tracking-wider">Edge Score</span>
          </div>
        </div>
        <p className="text-xs text-muted mt-2">Weighted average across {scores.length} {scores.length === 1 ? 'strategy' : 'strategies'}</p>
      </div>

      <div className="space-y-3">
        {scores.map((s, i) => {
          const style = EDGE_STYLES[s.edgeRating];
          return (
            <div key={s.strategy} className={`relative rounded-xl border ${style.border} overflow-hidden`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bar}`} />
              <div className="p-4 pl-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted font-mono">#{i + 1}</span>
                      <span className="font-semibold text-sm">{s.strategy}</span>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${style.text}`}>{s.edgeRating}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br ${gradeGradient(s.grade)} text-white`}>
                    <span className="text-lg font-bold">{s.grade}</span>
                    <span className="text-xl font-bold font-mono">{s.score}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  <Metric icon={<Target size={12} />} label="WR" value={formatPercent(s.winRate)} />
                  <Metric icon={<BarChart3 size={12} />} label="PF" value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)} />
                  <Metric icon={<Activity size={12} />} label="Exp" value={formatCurrency(s.expectancy)} tone={s.expectancy >= 0 ? 'pos' : 'neg'} />
                  <Metric icon={<Zap size={12} />} label="R:R" value={s.avgRiskReward > 0 ? `1:${s.avgRiskReward.toFixed(1)}` : '—'} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-themed/50">
                  <div className="flex flex-wrap gap-3">
                    <Metric icon={<Activity size={12} />} label="Cons" value={`${s.consistency.toFixed(0)}`} />
                    <Metric icon={<TrendingUp size={12} />} label="Trades" value={`${s.totalTrades}`} />
                    <Metric icon={s.pnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} label="P&L" value={formatCurrency(s.pnl)} tone={s.pnl >= 0 ? 'pos' : 'neg'} />
                  </div>
                  {(s.bestPair || s.bestSession) && (
                    <span className="text-[10px] text-muted">
                      {s.bestPair && <>Best: {s.bestPair}</>}{s.bestPair && s.bestSession && ' · '}{s.bestSession && <>{s.bestSession}</>}
                    </span>
                  )}
                </div>

                {s.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {s.flags.map((f, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning-500/10 border border-warning-500/20 text-warning-500 text-[10px]">
                        <AlertTriangle size={10} /> {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

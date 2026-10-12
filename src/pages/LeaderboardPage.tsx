import { useMemo, useState } from 'react';
import { Trophy, TrendingUp, Target, Activity, Crown, Medal, Award } from 'lucide-react';
import { useTrades, useProfiles } from '@/hooks/useData';
import { computeDashboardStats, formatCurrency, formatPercent } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LoadingSpinner, EmptyState } from '@/components/ui/Feedback';
import type { TraderProfile } from '@/lib/types';

type SortField = 'pnl' | 'winRate' | 'profitFactor' | 'totalTrades' | 'expectancy';

export function LeaderboardPage() {
  const { trades, loading } = useTrades();
  const { profiles, loading: profilesLoading } = useProfiles();
  const [sortField, setSortField] = useState<SortField>('pnl');

  const rankings = useMemo(() => {
    const byUser = new Map<string, { profile: TraderProfile; stats: ReturnType<typeof computeDashboardStats> }>();

    profiles.forEach(p => {
      const userTrades = trades.filter(t => t.user_id === p.id);
      if (userTrades.length === 0) return;
      const stats = computeDashboardStats(userTrades);
      byUser.set(p.id, { profile: p, stats });
    });

    const arr = Array.from(byUser.values());
    arr.sort((a, b) => {
      switch (sortField) {
        case 'pnl': return b.stats.totalPnl - a.stats.totalPnl;
        case 'winRate': return b.stats.winRate - a.stats.winRate;
        case 'profitFactor': return b.stats.profitFactor - a.stats.profitFactor;
        case 'totalTrades': return b.stats.totalTrades - a.stats.totalTrades;
        case 'expectancy': return b.stats.expectancy - a.stats.expectancy;
      }
    });

    // Assign ranks
    return arr.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [trades, profiles, sortField]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} className="text-amber-400" />;
    if (rank === 2) return <Medal size={20} className="text-slate-400" />;
    if (rank === 3) return <Award size={20} className="text-amber-700" />;
    return <span className="text-sm font-bold text-muted w-5 text-center">{rank}</span>;
  };

  if (loading || profilesLoading) return <LoadingSpinner label="Loading leaderboard..." />;

  return (
    <div>
      <SectionHeader
        title="Overview"
        subtitle="Track each other's progress — for accountability, not competition"
      />

      {/* Sort selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { key: 'pnl', label: 'Net P&L', icon: TrendingUp },
          { key: 'winRate', label: 'Win Rate', icon: Target },
          { key: 'profitFactor', label: 'Profit Factor', icon: Activity },
          { key: 'totalTrades', label: 'Volume', icon: Trophy },
          { key: 'expectancy', label: 'Expectancy', icon: TrendingUp },
        ] as { key: SortField; label: string; icon: typeof TrendingUp }[]).map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setSortField(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                sortField === s.key
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                  : 'bg-secondary border-themed text-secondary hover:border-muted'
              }`}
            >
              <Icon size={14} /> {s.label}
            </button>
          );
        })}
      </div>

      {rankings.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<Trophy size={40} />}
            title="No traders yet"
            message="Once traders sign up and log trades, the overview will show everyone's progress here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.slice(0, 3).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {rankings.slice(0, 3).map(({ profile, stats, rank }) => (
                <div key={profile.id} className={`card-gradient p-5 text-center relative overflow-hidden ${rank === 1 ? 'sm:-translate-y-2 border-accent-500/40 shadow-lg shadow-accent-500/10' : ''}`}>
                  <div className={`absolute inset-x-0 top-0 h-1 ${rank === 1 ? 'bg-gradient-to-r from-accent-400 to-accent-600' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700'}`} />
                  <div className="flex justify-center mb-3">{getRankIcon(rank)}</div>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="w-14 h-14 rounded-full object-cover mx-auto ring-2 ring-orange-500/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-white font-bold text-xl mx-auto">{profile.display_name.charAt(0).toUpperCase()}</div>
                  )}
                  <p className="font-semibold text-sm mt-3 truncate">{profile.display_name}</p>
                  <p className={`font-mono font-bold text-lg mt-1 ${stats.totalPnl >= 0 ? 'text-success-500' : 'text-error-500'}`}>{formatCurrency(stats.totalPnl)}</p>
                  <p className="text-[11px] text-muted mt-1">{formatPercent(stats.winRate)} win rate · {stats.totalTrades} trades</p>
                </div>
              ))}
            </div>
          )}
          {rankings.slice(3).map(({ profile, stats, rank }) => (
            <div
              key={profile.id}
              className="card p-4 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 flex items-center justify-center">
                {getRankIcon(rank)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold text-lg">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + style */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{profile.display_name}</h3>
                {profile.trading_style && (
                  <p className="text-xs text-muted truncate">{profile.trading_style}</p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-xs text-muted">Trades</p>
                  <p className="font-mono font-semibold">{stats.totalTrades}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">Win Rate</p>
                  <p className="font-mono font-semibold">{formatPercent(stats.winRate)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted">PF</p>
                  <p className="font-mono font-semibold">{stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}</p>
                </div>
              </div>

              {/* P&L */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted">Net P&L</p>
                <p className={`text-lg font-mono font-bold ${stats.totalPnl >= 0 ? 'text-success-500' : 'text-error-500'}`}>
                  {formatCurrency(stats.totalPnl)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

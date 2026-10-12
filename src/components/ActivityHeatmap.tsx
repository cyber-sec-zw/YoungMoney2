import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { Trade } from '@/lib/types';
import { parseISO, format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';

interface ActivityHeatmapProps {
  trades: Trade[];
}

export function ActivityHeatmap({ trades }: ActivityHeatmapProps) {
  const weeks = useMemo(() => {
    const today = new Date();
    const start = subDays(today, 364);
    const calStart = startOfWeek(start, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: calStart, end: today });

    const dayMap = new Map<string, { count: number; pnl: number }>();
    trades.forEach(t => {
      const key = format(parseISO(t.entry_time), 'yyyy-MM-dd');
      const ex = dayMap.get(key) || { count: 0, pnl: 0 };
      ex.count++;
      ex.pnl += t.pnl;
      dayMap.set(key, ex);
    });

    // Group into weeks (7-day columns)
    const weekCols: { date: Date; count: number; pnl: number }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7).map(d => {
        const key = format(d, 'yyyy-MM-dd');
        const data = dayMap.get(key) || { count: 0, pnl: 0 };
        return { date: d, count: data.count, pnl: data.pnl };
      });
      weekCols.push(week);
    }
    return weekCols;
  }, [trades]);

  const maxCount = useMemo(() => {
    let max = 0;
    weeks.forEach(w => w.forEach(d => { if (d.count > max) max = d.count; }));
    return max || 1;
  }, [weeks]);

  const getColor = (count: number, pnl: number) => {
    if (count === 0) return 'bg-secondary border-themed';
    const intensity = count / maxCount;
    if (pnl >= 0) {
      if (intensity > 0.75) return 'bg-success-500';
      if (intensity > 0.5) return 'bg-success-400';
      if (intensity > 0.25) return 'bg-success-300';
      return 'bg-success-200';
    } else {
      if (intensity > 0.75) return 'bg-error-500';
      if (intensity > 0.5) return 'bg-error-400';
      if (intensity > 0.25) return 'bg-error-300';
      return 'bg-error-200';
    }
  };

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const month = week[0].date.getMonth();
      if (month !== lastMonth) {
        labels.push({ label: format(week[0].date, 'MMM'), col });
        lastMonth = month;
      }
    });
    return labels;
  }, [weeks]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Activity size={16} className="text-brand-500" /> Trading Activity (Last 12 Months)
      </h3>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 pl-8 relative">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-muted absolute"
                style={{ left: `${8 + m.col * 15}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-1">
              {dayLabels.map((d, i) => (
                <span key={i} className="text-[9px] text-muted h-[12px] leading-[12px]">
                  {i % 2 === 1 ? d : ''}
                </span>
              ))}
            </div>
            {/* Heatmap cells */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`w-[12px] h-[12px] rounded-sm border ${getColor(day.count, day.pnl)} transition-all hover:ring-1 hover:ring-brand-500/30 cursor-pointer`}
                    title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} trade${day.count !== 1 ? 's' : ''}${day.count > 0 ? `, ${day.pnl >= 0 ? '+' : ''}$${day.pnl.toFixed(0)}` : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-[10px] text-muted">
            <span>Less</span>
            <div className="w-[12px] h-[12px] rounded-sm border border-themed bg-secondary" />
            <div className="w-[12px] h-[12px] rounded-sm bg-success-200" />
            <div className="w-[12px] h-[12px] rounded-sm bg-success-400" />
            <div className="w-[12px] h-[12px] rounded-sm bg-success-500" />
            <span>Profit</span>
            <div className="w-[12px] h-[12px] rounded-sm bg-error-200" />
            <div className="w-[12px] h-[12px] rounded-sm bg-error-400" />
            <div className="w-[12px] h-[12px] rounded-sm bg-error-500" />
            <span>Loss</span>
          </div>
        </div>
      </div>
    </div>
  );
}

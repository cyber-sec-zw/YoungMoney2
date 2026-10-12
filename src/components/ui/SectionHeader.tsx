import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-7 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 shadow-sm shadow-orange-500/30 animate-bar-draw" />
          <div className="relative">
            <div className="absolute -inset-x-2 -inset-y-1 bg-orange-500/5 blur-md rounded-lg" />
            <h1 className="relative text-xl font-bold tracking-tight">{title}</h1>
          </div>
        </div>
        {subtitle && <p className="mt-1 text-sm text-secondary ml-3.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

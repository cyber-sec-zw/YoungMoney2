import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-xl animate-pulse-glow" />
        <div className="relative w-14 h-14 rounded-full border-2 border-orange-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500 animate-spin" />
        <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" pathLength={100} className="animate-arc" opacity="0.6" />
        </svg>
        <Loader2 className="absolute inset-0 m-auto animate-spin text-orange-500/40" size={20} />
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dot-pulse-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dot-pulse-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dot-pulse-3" />
      </div>
      {label && <p className="mt-3 text-sm text-muted animate-pulse">{label}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon?: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4">
          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 text-orange-500/60">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted max-w-sm leading-relaxed">{message}</p>
    </div>
  );
}

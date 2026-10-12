import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { dataErrorEventName, type DataRecoveryError } from '@/lib/recovery';

export function DataRecoveryNotice() {
  const [issue, setIssue] = useState<DataRecoveryError | null>(null);

  useEffect(() => {
    const onDataError = (event: Event) => setIssue((event as CustomEvent<DataRecoveryError>).detail);
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      setIssue({ area: 'save or data request', message: event.reason instanceof Error ? event.reason.message : 'The request did not complete.' });
    };
    window.addEventListener(dataErrorEventName(), onDataError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener(dataErrorEventName(), onDataError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  if (!issue) return null;
  return (
    <div role="alert" className="mx-auto mb-4 flex max-w-7xl items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-primary">
      <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Data issue · {issue.area}</p>
        <p className="mt-0.5 break-words text-xs text-secondary">{issue.message}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-500"><RefreshCw size={13} /> Retry by reloading</button>
      </div>
      <button type="button" onClick={() => setIssue(null)} aria-label="Dismiss data warning" className="btn-ghost -mr-2 -mt-1 p-1"><X size={16} /></button>
    </div>
  );
}

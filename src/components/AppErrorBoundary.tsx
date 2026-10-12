import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { reportDataError } from '@/lib/recovery';

interface AppErrorBoundaryProps { children: ReactNode }
interface AppErrorBoundaryState { error: Error | null }

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    reportDataError('workspace', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="min-h-screen bg-primary px-5 py-12 text-primary">
        <section role="alert" className="mx-auto max-w-xl rounded-2xl border border-themed bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-error-500/10 text-error-500"><AlertTriangle size={22} /></div>
          <h1 className="text-xl font-bold">The workspace hit a problem</h1>
          <p className="mt-2 text-sm text-secondary">Your saved records are still in the database. Reload the workspace to recover; if this keeps happening, export a backup before continuing.</p>
          <p className="mt-3 break-words rounded-lg bg-secondary p-3 text-xs text-muted">{this.state.error.message}</p>
          <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}><RefreshCw size={15} /> Reload workspace</button>
        </section>
      </main>
    );
  }
}

import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Circle, AlertTriangle, Lock, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';
import type { TradeChecklistSnapshot } from '@/lib/types';

interface ChecklistItemShape {
  id: string;
  label: string;
  is_required: boolean;
  source_scope?: 'plan' | 'strategy' | 'entry_model' | 'legacy';
}

interface PreTradeChecklistProps {
  items: ChecklistItemShape[];
  snapshot: TradeChecklistSnapshot[];
  overrideReason: string | null;
  onSnapshotChange: (items: TradeChecklistSnapshot[]) => void;
  onOverrideReasonChange: (reason: string | null) => void;
}

export function PreTradeChecklist({ items, snapshot, overrideReason, onSnapshotChange, onOverrideReasonChange }: PreTradeChecklistProps) {
  const [showOverride, setShowOverride] = useState(overrideReason != null);

  useEffect(() => {
    if (!items.length) return;
    const previous = new Map(snapshot.map(item => [item.id || item.label, item]));
    const next = items.map(item => ({
      id: item.id,
      label: item.label,
      checked: previous.get(item.id)?.checked ?? previous.get(item.label)?.checked ?? false,
      is_required: item.is_required,
      source_scope: item.source_scope,
    }));
    const isCurrent = next.length === snapshot.length && next.every((item, index) => item.id === snapshot[index]?.id && item.is_required === snapshot[index]?.is_required && item.source_scope === snapshot[index]?.source_scope);
    if (!isCurrent) onSnapshotChange(next);
  }, [items, snapshot, onSnapshotChange]);

  const checkedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    snapshot.forEach(s => { map.set(s.label, s.checked); if (s.id) map.set(s.id, s.checked); });
    return map;
  }, [snapshot]);

  const requiredItems = items.filter(i => i.is_required);
  const optionalItems = items.filter(i => !i.is_required);
  const allRequiredChecked = requiredItems.every(item => checkedMap.get(item.id) === true || checkedMap.get(item.label) === true);
  const checkedCount = items.filter(item => checkedMap.get(item.id) === true || checkedMap.get(item.label) === true).length;

  const toggle = (item: ChecklistItemShape) => {
    const current = checkedMap.get(item.id) ?? checkedMap.get(item.label) ?? false;
    const newMap = new Map(checkedMap);
    newMap.set(item.id, !current);
    newMap.set(item.label, !current);
    const newSnapshot: TradeChecklistSnapshot[] = items.map(item => ({
      id: item.id,
      label: item.label,
      checked: newMap.get(item.id) ?? newMap.get(item.label) ?? false,
      is_required: item.is_required,
      source_scope: item.source_scope,
    }));
    onSnapshotChange(newSnapshot);

    // If all required are now checked, clear override
    const allReqChecked = items.filter(i => i.is_required).every(item => newMap.get(item.id) === true || newMap.get(item.label) === true);
    if (allReqChecked) {
      setShowOverride(false);
      onOverrideReasonChange(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks size={18} className="text-orange-500" />
          <h4 className="text-sm font-semibold">Pre-Trade Checklist</h4>
        </div>
        <span className={`text-xs font-semibold ${allRequiredChecked ? 'text-success-500' : 'text-muted'}`}>
          {checkedCount}/{items.length} checked
        </span>
      </div>

      {/* Required items */}
      {requiredItems.length > 0 && (
        <div className="space-y-1.5">
          {requiredItems.map(item => {
            const checked = checkedMap.get(item.id) ?? checkedMap.get(item.label) ?? false;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                  checked
                    ? 'bg-success-500/8 border-success-500/20'
                    : 'bg-secondary border-themed hover:border-strong'
                }`}
              >
                {checked
                  ? <CheckCircle2 size={18} className="text-success-500 flex-shrink-0" />
                  : <Circle size={18} className="text-muted flex-shrink-0" />}
                <span className={`text-sm ${checked ? 'text-secondary line-through' : 'text-primary font-medium'}`}>
                  {item.label}
                </span>
                <span title="Required"><Lock size={11} className="text-muted ml-auto flex-shrink-0" /></span>
              </button>
            );
          })}
        </div>
      )}

      {/* Optional items */}
      {optionalItems.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-1.5 cursor-pointer text-xs text-muted hover:text-secondary transition-colors py-1">
            <ChevronDown size={14} className="group-open:hidden" />
            <ChevronUp size={14} className="hidden group-open:block" />
            Optional checks ({optionalItems.length})
          </summary>
          <div className="space-y-1.5 mt-1.5">
            {optionalItems.map(item => {
              const checked = checkedMap.get(item.id) ?? checkedMap.get(item.label) ?? false;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border ${
                    checked
                      ? 'bg-success-500/8 border-success-500/20'
                      : 'bg-secondary border-themed hover:border-strong'
                  }`}
                >
                  {checked
                    ? <CheckCircle2 size={18} className="text-success-500 flex-shrink-0" />
                    : <Circle size={18} className="text-muted flex-shrink-0" />}
                  <span className={`text-sm ${checked ? 'text-secondary line-through' : 'text-primary font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </details>
      )}

      {/* Override section */}
      {!allRequiredChecked && (
        <div className="mt-3">
          {!showOverride ? (
            <button
              type="button"
              onClick={() => setShowOverride(true)}
              className="text-xs text-warning-600 dark:text-warning-400 hover:text-warning-500 font-medium flex items-center gap-1.5"
            >
              <AlertTriangle size={13} /> Override required checks with a reason
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-warning-500/8 border border-warning-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-warning-600 dark:text-warning-400">
                  Override Reason (required to save)
                </p>
              </div>
              <textarea
                className="input-field text-sm"
                rows={2}
                placeholder="Why are you skipping required checks? Be honest with yourself..."
                value={overrideReason ?? ''}
                onChange={e => onOverrideReasonChange(e.target.value || null)}
              />
              <button
                type="button"
                onClick={() => { setShowOverride(false); onOverrideReasonChange(null); }}
                className="text-xs text-muted hover:text-secondary"
              >
                Cancel override
              </button>
            </div>
          )}
        </div>
      )}

      {/* All clear indicator */}
      {allRequiredChecked && !overrideReason && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-success-500/8 border border-success-500/20 animate-fade-in">
          <CheckCircle2 size={16} className="text-success-500" />
          <p className="text-xs font-semibold text-success-500">All required checks complete — disciplined entry</p>
        </div>
      )}
    </div>
  );
}

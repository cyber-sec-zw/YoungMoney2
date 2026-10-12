import type { TradeChecklistSnapshot } from '@/lib/types';

export function setupQualityFromChecklist(snapshot: TradeChecklistSnapshot[]): number | null {
  if (!snapshot.length) return null;
  const checked = snapshot.filter(item => item.checked).length;
  return Math.max(1, Math.ceil(5 * checked / snapshot.length));
}

export function requiredChecklistFailures(snapshot: TradeChecklistSnapshot[]): string[] {
  return snapshot.filter(item => item.is_required && !item.checked).map(item => item.label);
}

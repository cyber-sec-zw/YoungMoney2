import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Shield, ListChecks, GripVertical, Loader2 } from 'lucide-react';
import type { RiskSettings, RiskSettingsInput, PreTradeChecklistItem } from '@/lib/types';
import { Modal } from './ui/Modal';

interface RiskSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: RiskSettings | null;
  checklist: PreTradeChecklistItem[];
  onSaveSettings: (input: RiskSettingsInput) => Promise<void>;
  onAddChecklistItem: (label: string, isRequired: boolean) => Promise<void>;
  onDeleteChecklistItem: (id: string) => Promise<void>;
}

export function RiskSettingsModal({ open, onClose, settings, checklist, onSaveSettings, onAddChecklistItem, onDeleteChecklistItem }: RiskSettingsModalProps) {
  const [form, setForm] = useState<RiskSettingsInput>({
    max_daily_loss_pct: 3.0,
    max_daily_trades: 5,
    max_risk_per_trade_pct: 1.0,
    account_balance: 10000,
    max_drawdown_pct: 10.0,
    daily_loss_limit_amount: null,
  });
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemRequired, setNewItemRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState<'risk' | 'checklist'>('risk');

  useEffect(() => {
    if (settings) {
      setForm({
        max_daily_loss_pct: settings.max_daily_loss_pct,
        max_daily_trades: settings.max_daily_trades,
        max_risk_per_trade_pct: settings.max_risk_per_trade_pct,
        account_balance: settings.account_balance,
        max_drawdown_pct: settings.max_drawdown_pct,
        daily_loss_limit_amount: settings.daily_loss_limit_amount,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSettings(form);
      onClose();
    } catch (err) {
      console.error('Failed to save risk settings:', err);
    }
    setSaving(false);
  };

  const handleAddItem = async () => {
    if (!newItemLabel.trim()) return;
    setAdding(true);
    try {
      await onAddChecklistItem(newItemLabel.trim(), newItemRequired);
      setNewItemLabel('');
      setNewItemRequired(true);
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    }
    setAdding(false);
  };

  const labelCls = 'block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide';
  const inputCls = 'input-field';

  return (
    <Modal open={open} onClose={onClose} title="Risk & Discipline Settings" size="lg">
      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-secondary">
        <button
          onClick={() => setTab('risk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
            tab === 'risk' ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-secondary'
          }`}
        >
          <Shield size={16} /> Risk Limits
        </button>
        <button
          onClick={() => setTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
            tab === 'checklist' ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-secondary'
          }`}
        >
          <ListChecks size={16} /> Pre-Trade Checklist
        </button>
      </div>

      {tab === 'risk' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Account Balance ($)</label>
              <input
                type="number"
                step="100"
                className={inputCls}
                value={form.account_balance}
                onChange={e => setForm(f => ({ ...f, account_balance: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-[11px] text-muted mt-1">Used for risk percentage calculations</p>
            </div>
            <div>
              <label className={labelCls}>Max Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={form.max_risk_per_trade_pct}
                onChange={e => setForm(f => ({ ...f, max_risk_per_trade_pct: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-[11px] text-muted mt-1">Warns if a trade exceeds this risk</p>
            </div>
            <div>
              <label className={labelCls}>Max Daily Loss (%)</label>
              <input
                type="number"
                step="0.5"
                className={inputCls}
                value={form.max_daily_loss_pct}
                onChange={e => setForm(f => ({ ...f, max_daily_loss_pct: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-[11px] text-muted mt-1">Of account balance — red alert when reached</p>
            </div>
            <div>
              <label className={labelCls}>Max Daily Trades</label>
              <input
                type="number"
                step="1"
                min="1"
                className={inputCls}
                value={form.max_daily_trades}
                onChange={e => setForm(f => ({ ...f, max_daily_trades: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-[11px] text-muted mt-1">Prevents overtrading</p>
            </div>
            <div>
              <label className={labelCls}>Max Drawdown (%)</label>
              <input
                type="number"
                step="1"
                className={inputCls}
                value={form.max_drawdown_pct}
                onChange={e => setForm(f => ({ ...f, max_drawdown_pct: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-[11px] text-muted mt-1">From peak equity — warns as you approach</p>
            </div>
            <div>
              <label className={labelCls}>Daily Loss Limit ($) — Optional</label>
              <input
                type="number"
                step="50"
                className={inputCls}
                placeholder="Use percentage instead"
                value={form.daily_loss_limit_amount ?? ''}
                onChange={e => setForm(f => ({ ...f, daily_loss_limit_amount: e.target.value ? parseFloat(e.target.value) : null }))}
              />
              <p className="text-[11px] text-muted mt-1">Overrides percentage if set</p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-themed">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Risk Limits'}
            </button>
          </div>
        </div>
      )}

      {tab === 'checklist' && (
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            These items appear every time you log a trade. Required items must be checked (or overridden with a reason) before saving.
          </p>

          {/* Existing checklist items */}
          <div className="space-y-2">
            {checklist.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-themed group">
                <GripVertical size={16} className="text-muted flex-shrink-0 opacity-50" />
                <span className="text-xs text-muted font-mono flex-shrink-0">{idx + 1}</span>
                <span className="text-sm flex-1 truncate">{item.label}</span>
                <span className={`badge ${item.is_required ? 'badge-error' : 'badge-neutral'} flex-shrink-0`}>
                  {item.is_required ? 'Required' : 'Optional'}
                </span>
                <button
                  onClick={() => onDeleteChecklistItem(item.id)}
                  className="text-muted hover:text-error-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new item */}
          <div className="p-3 rounded-xl bg-secondary border border-themed space-y-3">
            <p className="text-xs font-semibold text-secondary uppercase tracking-wide">Add New Item</p>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. 'Confirmed market structure on 4H chart'"
              value={newItemLabel}
              onChange={e => setNewItemLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddItem()}
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItemRequired}
                  onChange={e => setNewItemRequired(e.target.checked)}
                  className="w-4 h-4 rounded accent-orange-500"
                />
                <span className="text-secondary">Required</span>
              </label>
              <button
                onClick={handleAddItem}
                disabled={adding || !newItemLabel.trim()}
                className="btn-primary ml-auto"
              >
                {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

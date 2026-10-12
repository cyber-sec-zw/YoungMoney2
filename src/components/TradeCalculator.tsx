import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, TrendingDown, Zap, RotateCcw, ShieldAlert, Percent } from 'lucide-react';
import { calcPips, calcPnl, formatCurrency, formatPips } from '@/lib/utils';

export function TradeCalculator() {
  const [pair, setPair] = useState('EUR/USD');
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState('');
  const [exit, setExit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [accountSize, setAccountSize] = useState('');

  const result = useMemo(() => {
    const e = entry ? parseFloat(entry) : null;
    const x = exit ? parseFloat(exit) : null;
    const sl = stopLoss ? parseFloat(stopLoss) : null;
    const lot = lotSize ? parseFloat(lotSize) : null;
    const acct = accountSize ? parseFloat(accountSize) : null;

    let pips = 0;
    let pnl = 0;
    let rr: number | null = null;
    let riskAmount = 0;
    let riskPercent = 0;

    if (e != null && x != null && pair) {
      pips = calcPips(pair, direction, e, x);
    }
    if (lot != null && pips !== 0) {
      pnl = calcPnl(pips, lot, pair);
    }
    if (e != null && sl != null) {
      const riskPips = Math.abs(calcPips(pair, direction, e, sl));
      if (lot != null) {
        riskAmount = Math.abs(calcPnl(-riskPips, lot, pair));
      }
      if (x != null) {
        const reward = direction === 'long' ? x - e : e - x;
        const risk = Math.abs(e - sl);
        if (risk > 0) rr = reward / risk;
      }
    }
    if (acct && riskAmount > 0) {
      riskPercent = (riskAmount / acct) * 100;
    }

    return { pips, pnl, rr, riskAmount, riskPercent, hasData: e != null && x != null };
  }, [pair, direction, entry, exit, stopLoss, lotSize, accountSize]);

  const reset = () => {
    setEntry(''); setExit(''); setStopLoss(''); setLotSize(''); setAccountSize('');
  };

  const inputCls = 'input-field';
  const labelCls = 'block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide';

  const resultCards = [
    { label: 'Pips', value: result.hasData ? formatPips(result.pips) : '—', icon: Calculator, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'P&L', value: result.hasData && lotSize ? formatCurrency(result.pnl) : '—', icon: result.pnl >= 0 ? TrendingUp : TrendingDown, color: result.pnl >= 0 ? 'text-success-500' : 'text-error-500', bg: result.pnl >= 0 ? 'bg-success-500/10' : 'bg-error-500/10' },
    { label: 'R:R', value: result.rr != null ? `1:${result.rr.toFixed(2)}` : '—', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Risk $', value: result.riskAmount > 0 ? formatCurrency(result.riskAmount) : '—', icon: ShieldAlert, color: 'text-error-500', bg: 'bg-error-500/10' },
    { label: 'Risk %', value: result.riskPercent > 0 ? `${result.riskPercent.toFixed(2)}%` : '—', icon: Percent, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10">
            <Calculator size={16} className="text-orange-500" />
          </div>
          Trade Calculator
        </h3>
        <button onClick={reset} className="btn-ghost p-1.5 text-xs">
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div>
          <label className={labelCls}>Pair</label>
          <input className={inputCls} value={pair} onChange={e => setPair(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className={labelCls}>Direction</label>
          <select className={inputCls} value={direction} onChange={e => setDirection(e.target.value as 'long' | 'short')}>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Lot Size</label>
          <input type="number" step="0.01" className={inputCls} placeholder="0.50" value={lotSize} onChange={e => setLotSize(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Entry Price</label>
          <input type="number" step="0.00001" className={inputCls} placeholder="1.08500" value={entry} onChange={e => setEntry(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Exit Price</label>
          <input type="number" step="0.00001" className={inputCls} placeholder="1.08700" value={exit} onChange={e => setExit(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Stop Loss</label>
          <input type="number" step="0.00001" className={inputCls} placeholder="1.08300" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
        </div>
        <div className="col-span-2 lg:col-span-3">
          <label className={labelCls}>Account Size ($)</label>
          <input type="number" step="100" className={inputCls} placeholder="10000" value={accountSize} onChange={e => setAccountSize(e.target.value)} />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {resultCards.map((r, i) => {
          const Icon = r.icon;
          return (
            <div key={i} className="p-3 rounded-xl bg-secondary border border-themed text-center hover:border-orange-500/20 transition-colors">
              <div className={`inline-flex p-1.5 rounded-lg ${r.bg} mb-1.5`}>
                <Icon size={14} className={r.color} />
              </div>
              <p className="text-[10px] font-semibold text-muted uppercase mb-0.5">{r.label}</p>
              <p className={`text-base font-mono font-bold ${r.color}`}>{r.value}</p>
            </div>
          );
        })}
      </div>

      {!result.hasData && (
        <p className="mt-3 text-xs text-muted text-center">Enter entry and exit prices to see live calculations</p>
      )}
    </div>
  );
}

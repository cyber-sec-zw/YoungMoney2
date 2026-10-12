import { useState, useRef, useEffect } from 'react';
import { Lightbulb, X } from 'lucide-react';

interface SuggestInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  suggestions: string[];
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export function SuggestInput({ value, onChange, placeholder, suggestions, multiline, rows, className }: SuggestInputProps) {
  const [showSuggest, setShowSuggest] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) &&
    s.toLowerCase() !== value.toLowerCase()
  ).slice(0, 4);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const baseCls = className || 'input-field';

  return (
    <div ref={containerRef} className="relative">
      {multiline ? (
        <textarea
          className={baseCls}
          rows={rows || 2}
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
        />
      ) : (
        <input
          className={baseCls}
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value.toUpperCase()); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
        />
      )}

      {showSuggest && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 card border border-themed rounded-xl overflow-hidden shadow-lg animate-slide-up">
          {filtered.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(s); setShowSuggest(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary transition-colors border-b border-themed/50 last:border-0"
            >
              <Lightbulb size={14} className="text-accent-500 flex-shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}

      {value && !multiline && (
        <button
          type="button"
          onClick={() => { onChange(''); setShowSuggest(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-primary transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

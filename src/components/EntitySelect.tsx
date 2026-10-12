interface EntitySelectOption {
  id: string;
  name: string;
}

interface EntitySelectProps {
  label: string;
  options: EntitySelectOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  required?: boolean;
}

export function EntitySelect({ label, options, value, onChange, placeholder = 'Select...', required }: EntitySelectProps) {
  const labelCls = 'block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide';
  const inputCls = 'input-field';

  return (
    <div>
      <label className={labelCls}>
        {label}{required && ' *'}
      </label>
      {options.length > 0 ? (
        <select
          className={inputCls}
          value={value || ''}
          onChange={e => onChange(e.target.value || null)}
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      ) : (
        <p className="text-xs text-muted py-2">None available yet.</p>
      )}
    </div>
  );
}

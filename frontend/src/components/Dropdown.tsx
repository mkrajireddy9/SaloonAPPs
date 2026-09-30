import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export function Dropdown({ value, options, onChange, ariaLabel, placeholder = 'Select' }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; ariaLabel: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value);
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  return <div className={`app-dropdown${open ? ' is-open' : ''}`} ref={ref}>
    <button type="button" className="app-dropdown-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen(current => !current)}><span>{selected?.label || placeholder}</span><ChevronDown size={15}/></button>
    {open && <div className="app-dropdown-menu" role="listbox" aria-label={ariaLabel}>{options.map(option => <button type="button" role="option" aria-selected={option.value === value} className={`app-dropdown-option${option.value === value ? ' is-selected' : ''}`} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>{option.value === value ? <Check size={14}/> : <span className="dropdown-check-space"/>}{option.label}</button>)}</div>}
  </div>;
}

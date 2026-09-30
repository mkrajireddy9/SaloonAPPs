import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const pad = (value: number) => String(value).padStart(2, '0');
const format = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function DatePicker({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel: string }) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const ref = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: 42 }, (_, index) => { const first = new Date(month.getFullYear(), month.getMonth(), 1); const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7)); const date = new Date(start); date.setDate(start.getDate() + index); return date; });
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  return <div className="date-picker" ref={ref}><button type="button" className="date-picker-trigger" aria-label={ariaLabel} onClick={() => setOpen(current => !current)}><CalendarDays size={14}/><span>{value || 'dd/mm/yyyy'}</span></button>{open && <div className="date-picker-menu"><div className="date-picker-head"><button type="button" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={15}/></button><b>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b><button type="button" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={15}/></button></div><div className="date-picker-weekdays">{['M','T','W','T','F','S','S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="date-picker-grid">{days.map(day => { const date = format(day); return <button type="button" className={`${day.getMonth() !== month.getMonth() ? 'outside ' : ''}${date === value ? 'selected' : ''}`} key={date} onClick={() => { onChange(date); setOpen(false); }}>{day.getDate()}</button>; })}</div></div>}</div>;
}

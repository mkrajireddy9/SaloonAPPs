import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Scissors, X } from 'lucide-react';
import { ShellTitle } from '../components/ShellTitle';
import { useToast } from '../components/Toast';
import { request } from '../api';
import type { Appointment, SalonBranch, SalonConfig } from '../types';
import { BannerStrip } from '../components/BannerStrip';

const pad = (value: number) => String(value).padStart(2, '0');
const toDateValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
function removePastSlots(slots: string[], selectedDate: string) {
  const now = new Date();
  if (selectedDate !== toDateValue(now)) return slots;
  return slots.filter(slot => { const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i); if (!match) return true; let hour = Number(match[1]); const minute = Number(match[2]); const meridiem = match[3].toUpperCase(); if (meridiem === 'PM' && hour !== 12) hour += 12; if (meridiem === 'AM' && hour === 12) hour = 0; return hour * 60 + minute > now.getHours() * 60 + now.getMinutes(); });
}
function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function fallbackBranch(salon: SalonConfig): SalonBranch {
  return { id: 'main', name: salon.name || 'Main branch', location: salon.location, active: true, openingHours: salon.openingHours, closedDays: salon.closedDays, services: salon.services, stylists: salon.stylists };
}

function BookingSelect({ label, value, options, getLabel, onChange }: { label: string; value: string; options: string[]; getLabel?: (option: string) => string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(Math.max(0, options.indexOf(value)));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.indexOf(value));
  const selectedLabel = options[selectedIndex] ? (getLabel ? getLabel(options[selectedIndex]) : options[selectedIndex]) : 'Select an option';
  useEffect(() => setHighlighted(selectedIndex), [selectedIndex]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const choose = (option: string) => { onChange(option); setOpen(false); };
  const move = (direction: number) => setHighlighted(current => Math.min(options.length - 1, Math.max(0, current + direction)));
  return <div className="field booking-select-field" ref={wrapperRef}>
    <label>{label}</label>
    <div className={`booking-select${open ? ' is-open' : ''}`}>
      <button type="button" className="booking-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)} onKeyDown={event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); move(1); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); move(-1); }
        if (event.key === 'Enter' && open) { event.preventDefault(); if (options[highlighted]) choose(options[highlighted]); }
        if (event.key === 'Escape') setOpen(false);
      }}>
        <span>{selectedLabel}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="booking-select-menu" role="listbox" aria-label={label}>
        {options.map((option, index) => <button type="button" role="option" aria-selected={option === value} className={`booking-select-option${index === highlighted ? ' is-highlighted' : ''}${option === value ? ' is-selected' : ''}`} key={option} onMouseEnter={() => setHighlighted(index)} onClick={() => choose(option)}>{getLabel ? getLabel(option) : option}</button>)}
      </div>}
    </div>
  </div>;
}

function BookingMultiSelect({ label, values, options, onChange }: { label: string; values: string[]; options: string[]; onChange: (values: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const toggle = (option: string) => onChange(values.includes(option) ? values.filter(item => item !== option) : [...values, option]);
  return <div className="field booking-select-field" ref={wrapperRef}>
    <label>{label}</label>
    <div className={`booking-select${open ? ' is-open' : ''}`}>
      <button type="button" className="booking-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
        <span className={values.length ? '' : 'booking-select-placeholder'}>{values.length ? `${values.length} service${values.length > 1 ? 's' : ''} selected` : 'Select one or more services'}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && <div className="booking-select-menu" role="listbox" aria-label={label} aria-multiselectable="true">
        {options.map(option => <button type="button" role="option" aria-selected={values.includes(option)} className={`booking-select-option booking-select-multi-option${values.includes(option) ? ' is-selected' : ''}`} key={option} onClick={() => toggle(option)}><span className="booking-checkbox" aria-hidden="true">{values.includes(option) ? '✓' : ''}</span>{option}</button>)}
      </div>}
    </div>
    {values.length > 0 && <div className="booking-selected-services">{values.map(value => <span key={value}>{value}</span>)}</div>}
  </div>;
}

export function AppointmentsScreen({ appointments, onCreate, onCancel, onReschedule, salon, onNavigate }: { appointments: Appointment[]; onCreate: (appointment: Appointment) => void; onCancel: (id: string) => void; onReschedule: (id: string, date: string, time: string) => void; salon: SalonConfig; onNavigate?: (path: string) => void }) {
  const { showToast } = useToast();
  const today = new Date();
  const branches = useMemo(() => (salon.branches?.length ? salon.branches : [fallbackBranch(salon)]).filter(branch => branch.active !== false), [salon]);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [branchId, setBranchId] = useState(branches[0]?.id || 'main');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState(toDateValue(new Date(today.getTime() + 7 * 86400000)));
  const [time, setTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [stylist, setStylist] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [rescheduleMonth, setRescheduleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleTimes, setRescheduleTimes] = useState<string[]>([]);
  const days = useMemo(() => calendarDays(month), [month]);
  const rescheduleDays = useMemo(() => calendarDays(rescheduleMonth), [rescheduleMonth]);
  const branch = branches.find(item => item.id === branchId) || branches[0];
  const services = branch?.services?.length ? branch.services : salon.services;
  const stylists = branch?.stylists?.length ? branch.stylists : salon.stylists;
  const stylistSchedule = salon.stylistSchedules?.[stylist];
  const rescheduleBranch = rescheduling ? branches.find(item => item.id === rescheduling.branchId) || branch : branch;
  const rescheduleSchedule = rescheduling ? salon.stylistSchedules?.[rescheduling.stylist] : undefined;

  useEffect(() => { if (!branches.some(item => item.id === branchId)) setBranchId(branches[0]?.id || 'main'); }, [branchId, branches]);
  useEffect(() => { void request<{ phone?: string }>('/customers/me').then(profile => setPhone(profile.phone || '')).catch(() => undefined); }, []);
  const service = selectedServices.join(', ');
  useEffect(() => { setSelectedServices(current => current.filter(item => services.includes(item)).length ? current.filter(item => services.includes(item)) : (services[0] ? [services[0]] : [])); setStylist(current => stylists.includes(current) ? current : stylists[0] || ''); }, [branchId, services, stylists]);
  useEffect(() => {
    let active = true;
    if (!branch || !service || !stylist) return undefined;
    void request<string[]>(`/appointments/slots?date=${encodeURIComponent(date)}&salonId=${encodeURIComponent(salon.id || '')}&branchId=${encodeURIComponent(branch.id)}&stylist=${encodeURIComponent(stylist)}&service=${encodeURIComponent(service)}`).then(slots => { if (!active) return; const usable = removePastSlots(slots, date); setAvailableTimes(usable); setTime(current => usable.includes(current) ? current : usable[0] || ''); }).catch(() => { if (active) { setAvailableTimes([]); setTime(''); } });
    return () => { active = false; };
  }, [branch, date, service, stylist]);
  useEffect(() => {
    let active = true;
    if (!rescheduling || !rescheduleBranch || !rescheduleDate) return undefined;
    void request<string[]>(`/appointments/slots?date=${encodeURIComponent(rescheduleDate)}&salonId=${encodeURIComponent(salon.id || '')}&branchId=${encodeURIComponent(rescheduleBranch.id)}&stylist=${encodeURIComponent(rescheduling.stylist)}&service=${encodeURIComponent(rescheduling.service)}`).then(slots => { if (!active) return; const usable = removePastSlots(slots, rescheduleDate); setRescheduleTimes(usable); setRescheduleTime(current => usable.includes(current) ? current : usable[0] || ''); }).catch(() => { if (active) { setRescheduleTimes([]); setRescheduleTime(''); } });
    return () => { active = false; };
  }, [rescheduleBranch, rescheduleDate, rescheduling]);

  const selectDate = (value: string) => { setDate(value); const next = new Date(`${value}T00:00:00`); setMonth(new Date(next.getFullYear(), next.getMonth(), 1)); };
  const selectRescheduleDate = (value: string) => { setRescheduleDate(value); const next = new Date(`${value}T00:00:00`); setRescheduleMonth(new Date(next.getFullYear(), next.getMonth(), 1)); };
  const submit = async () => {
    if (!time || !branch) return;
    try { if (phone.trim()) await request('/customers/me', { method: 'PATCH', body: JSON.stringify({ phone: phone.trim() }) }); await onCreate({ id: `appointment-${Date.now()}`, salonId: salon.id, service, branchId: branch.id, date, time, stylist, notes, guestPhone: phone.trim(), status: 'Requested' }); setNotes(''); showToast('Appointment request sent to the salon.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not create the appointment.', 'error'); }
  };
  const openReschedule = (appointment: Appointment) => { const next = new Date(`${appointment.date}T00:00:00`); setRescheduling(appointment); setRescheduleDate(appointment.date); setRescheduleMonth(new Date(next.getFullYear(), next.getMonth(), 1)); setRescheduleTime(''); };
  const submitReschedule = async () => {
    if (!rescheduling || !rescheduleDate || !rescheduleTime) return;
    try { await onReschedule(rescheduling.id, rescheduleDate, rescheduleTime); setRescheduling(null); showToast('Appointment rescheduled and sent for confirmation.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Could not reschedule the appointment.', 'error'); }
  };
  const isClosed = (value: string, selectedBranch: SalonBranch | undefined, selectedSchedule: { workingDays: string[]; leaveDates: string[] } | undefined) => { const weekday = new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }); return Boolean(selectedBranch && (selectedBranch.closedDays.includes(weekday) || Boolean(selectedSchedule && (!selectedSchedule.workingDays.includes(weekday) || selectedSchedule.leaveDates.includes(value))))); };
  const renderCalendar = (calendar: Date[], selected: string, calendarMonth: Date, onSelect: (value: string) => void, selectedBranch: SalonBranch | undefined, selectedSchedule: { workingDays: string[]; leaveDates: string[] } | undefined) => <div className="calendar-grid">{calendar.map(day => { const value = toDateValue(day); const outside = day.getMonth() !== calendarMonth.getMonth(); const past = value < toDateValue(today); const closed = isClosed(value, selectedBranch, selectedSchedule); return <button type="button" key={value} className={`calendar-day${selected === value ? ' selected' : ''}${outside ? ' outside' : ''}`} disabled={past || closed} onClick={() => onSelect(value)}><b>{day.getDate()}</b>{!past && !closed && <small>open</small>}{closed && <small>closed</small>}</button>; })}</div>;

  return <section className="page appointments">
    <ShellTitle eyebrow="YOUR HAIR, YOUR TIME" title="Make space for your next visit." copy={`Choose a time at ${salon.name}. Your stylist will confirm the details shortly.`} action={<span className="guest-pill">GUEST VIEW</span>} />
    <BannerStrip onNavigate={onNavigate} />
    <div className="appointments-grid">
      <section className="panel appointment-form">
        <div className="section-label"><span className="round-icon peach"><CalendarDays size={16} /></span><div><b>Book an appointment</b><small>{salon.location}</small></div></div>
        <BookingSelect label="Choose a branch" value={branch?.id || ''} options={branches.map(item => item.id)} getLabel={value => { const item = branches.find(branchItem => branchItem.id === value); return item ? `${item.name} · ${item.location}` : value; }} onChange={setBranchId} />
        <BookingMultiSelect label="What would you like to book?" values={selectedServices} options={services} onChange={setSelectedServices} />
        <BookingSelect label="Preferred stylist" value={stylist} options={stylists} onChange={setStylist} />
        <div className="field"><label>WhatsApp or SMS number</label><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="+91 98450 12345" /></div>
        <div className="calendar-panel"><div className="calendar-header"><button type="button" className="icon-button" aria-label="Previous month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={16} /></button><b>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b><button type="button" className="icon-button" aria-label="Next month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={16} /></button></div><div className="calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div>{renderCalendar(days, date, month, selectDate, branch, stylistSchedule)}</div>
        <div className="field"><label>Available time slots · {new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</label><div className="tags">{availableTimes.length ? availableTimes.map(slot => <button type="button" className={time === slot ? 'soft' : 'text-button'} key={slot} onClick={() => setTime(slot)}><Clock3 size={13} />{slot}</button>) : <small>No slots available for this date.</small>}</div></div>
        <div className="field"><label>Anything you’d like us to know?</label><textarea className="appointment-notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Tell us about your hair goals..." /></div>
        <button className="primary wide" disabled={!time || !branch} onClick={() => void submit()}><Plus size={17} />Request appointment</button>
      </section>
      <section><div className="appointment-intro"><Scissors size={22} /><label>YOUR STUDIO, REMEMBERED</label><h2>Every visit starts with context.</h2><p>Your notes, preferences, and favourite styles help the Halo team make the next conversation feel familiar.</p></div><section className="panel upcoming"><label>UPCOMING VISITS</label>{appointments.length === 0 && <div className="empty-appointments"><Clock3 size={19} /><p>No appointments yet.<br />Your next good hair day can start here.</p></div>}{appointments.map(appointment => <div className="appointment-card" key={appointment.id}><div className="appointment-date"><b>{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit' })}</b><small>{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}</small></div><div><b>{appointment.service}</b><p><MapPin size={12} /> {(branches.find(item => item.id === appointment.branchId) || branch)?.name || 'Main branch'}</p><p>{appointment.time} · {appointment.stylist}</p><span className="requested"><i /> {appointment.status}</span>{appointment.status !== 'Cancelled' && <div className="appointment-actions"><button className="text-button" onClick={() => openReschedule(appointment)}>Reschedule</button><button className="text-button" onClick={() => onCancel(appointment.id)}>Cancel</button></div>}</div>{appointment.status === 'Confirmed' ? <Check size={16} /> : <Clock3 size={16} />}</div>)}</section></section>
    </div>
    {rescheduling && <div className="booking-modal-backdrop" role="presentation" onClick={() => setRescheduling(null)}><section className="panel booking-modal" role="dialog" aria-modal="true" aria-label="Reschedule appointment" onClick={event => event.stopPropagation()}><div className="panel-head"><div><label>RESCHEDULE VISIT</label><h2>Choose a new time</h2></div><button className="icon-button" title="Close reschedule" onClick={() => setRescheduling(null)}><X size={17} /></button></div><p className="modal-summary">{rescheduling.service} · {rescheduling.stylist} · {rescheduleBranch?.name}</p><div className="calendar-panel"><div className="calendar-header"><button type="button" className="icon-button" aria-label="Previous month" onClick={() => setRescheduleMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={16} /></button><b>{rescheduleMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b><button type="button" className="icon-button" aria-label="Next month" onClick={() => setRescheduleMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={16} /></button></div><div className="calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div>{renderCalendar(rescheduleDays, rescheduleDate, rescheduleMonth, selectRescheduleDate, rescheduleBranch, rescheduleSchedule)}</div><div className="field"><label>Available time slots</label><div className="tags">{rescheduleTimes.length ? rescheduleTimes.map(slot => <button type="button" className={rescheduleTime === slot ? 'soft' : 'text-button'} key={slot} onClick={() => setRescheduleTime(slot)}><Clock3 size={13} />{slot}</button>) : <small>No slots available for this date.</small>}</div></div><div className="modal-actions"><button className="soft" onClick={() => setRescheduling(null)}>Keep current time</button><button className="primary" disabled={!rescheduleTime} onClick={() => void submitReschedule()}><Check size={16} />Save new time</button></div></section></div>}
  </section>;
}

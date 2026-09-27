import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { BarChart3, Bell, BookOpen, CalendarDays, CircleHelp, Home, LogOut, MapPin, Menu, Palette, Plus, Sparkles, Tag, X } from 'lucide-react';
import type { Role } from '../types';
import type { Appointment } from '../types';
import { defaultTheme, type ThemeConfig } from '../theme';
import { request } from '../api';

export type View = 'today' | 'new' | 'scan' | 'report' | 'passport' | 'appointments' | 'studio' | 'salon' | 'price-list' | 'tools';
export function StudioLayout({ view, setView, role, onLogout, notifications, children }: { view: View; setView: (view: View) => void; role: Role; onLogout: () => void; notifications: Appointment[]; children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Detecting location...');
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [themeReady, setThemeReady] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [displayName, setDisplayName] = useState(role === 'admin' ? 'Studio admin' : 'Guest');
  useEffect(() => { void request<ThemeConfig>('/salon/theme').then(savedTheme => setTheme({ ...defaultTheme, ...savedTheme })).catch(() => undefined).finally(() => setThemeReady(true)); }, []);
  useEffect(() => { if (!themeReady || role !== 'admin') return; const timer = window.setTimeout(() => { void request<ThemeConfig>('/salon/theme', { method: 'PUT', body: JSON.stringify(theme) }).catch(() => undefined); }, 350); return () => window.clearTimeout(timer); }, [theme, themeReady, role]);
  useEffect(() => { const token = localStorage.getItem('halo-token'); try { const payload = token ? JSON.parse(atob(token.split('.')[1])) as { name?: string } : {}; if (payload.name) setDisplayName(payload.name); } catch { /* optional display metadata */ } }, [role]);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!navigator.geolocation) {
      setCurrentLocation('Location unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`);
        if (!response.ok) throw new Error('Location lookup failed');
        const data = await response.json() as { locality?: string; city?: string; principalSubdivision?: string };
        const area = data.locality;
        const city = data.city || data.principalSubdivision;
        setCurrentLocation([area, city].filter(Boolean).join(', ') || `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
      } catch {
        setCurrentLocation(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
      }
    }, () => setCurrentLocation('Location unavailable'), { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 });
  }, []);
  const go = (next: View) => { setView(next); setMobileNav(false); };
  const cssVars = { '--rust': theme.primary, '--dark': theme.sidebar, '--cream': theme.surface, '--ink': theme.ink } as CSSProperties;
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const timeLabel = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const initials = displayName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return <div className="app" style={cssVars}><aside className={mobileNav ? 'sidebar open' : 'sidebar'}><div className="brand">{theme.logoUrl ? <img className="brand-image" src={theme.logoUrl} alt={theme.brandName}/> : <span className="brand-mark">{theme.logoMark}</span>}<div><strong>{theme.brandName}</strong><small>CONSULTATION STUDIO</small></div></div><nav><p>{role === 'admin' ? 'STUDIO WORKSPACE' : 'YOUR SPACE'}</p>{role === 'admin' ? <><Nav active={view === 'today'} icon={<Home size={16}/>} label="Today" onClick={() => go('today')}/><Nav active={view === 'studio'} icon={<BarChart3 size={16}/>} label="Studio data" onClick={() => go('studio')}/><Nav active={view === 'price-list'} icon={<Tag size={16}/>} label="Prices & offers" onClick={() => go('price-list')}/><Nav active={view === 'new' || view === 'scan' || view === 'report'} icon={<Plus size={17}/>} label="New consultation" onClick={() => go('new')}/><Nav active={view === 'passport'} icon={<BookOpen size={16}/>} label="Hair Passports" onClick={() => go('passport')}/></> : <><Nav active={view === 'appointments'} icon={<CalendarDays size={16}/>} label="My appointments" onClick={() => go('appointments')}/><Nav active={view === 'price-list'} icon={<Tag size={16}/>} label="Prices & offers" onClick={() => go('price-list')}/></>}</nav><div className="halo-note"><Sparkles size={15}/><b>{theme.brandName} note</b><p>The best consultation leaves the guest feeling understood before the scissors come out.</p></div><div className="profile"><span className="avatar yellow">{initials || 'GU'}</span><div><b>{displayName}</b><small>{role === 'admin' ? 'Studio administrator' : 'Guest account'}</small></div><button className="logout-button" title="Sign out" onClick={onLogout}><LogOut size={15}/></button></div></aside><main><header><button className="icon-button menu" onClick={() => setMobileNav(!mobileNav)}><Menu size={20}/></button><div className="crumb" title="Based on your browser location"><MapPin size={15}/><span>{currentLocation}</span><i>/</i> {theme.brandName}</div><div className="top-actions"><button className="quick-guide-trigger" onClick={() => setGuideOpen(true)}><CircleHelp size={16}/><span>Quick guide</span></button><button className="notification-trigger" title="Open notifications" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17}/>{role === 'admin' && notifications.length > 0 && <em>{notifications.length}</em>}</button><button className="settings-trigger" title="Customize theme and logo" onClick={() => setSettingsOpen(!settingsOpen)}><Palette size={17}/></button><i></i><b>{role === 'admin' ? dateLabel : `Welcome, ${displayName}`}<small>{role === 'admin' ? timeLabel : 'Guest account'}</small></b></div></header>{settingsOpen && <ThemePanel theme={theme} onChange={setTheme} onClose={() => setSettingsOpen(false)}/>} {notificationsOpen && <NotificationPanel role={role} notifications={notifications} onClose={() => setNotificationsOpen(false)}/>} {guideOpen && <QuickGuide role={role} onClose={() => setGuideOpen(false)}/>} {children}</main></div>;
}
function Nav({ active, icon, label, badge, onClick }: { active: boolean; icon: ReactNode; label: string; badge?: string; onClick: () => void }) { return <button className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}>{icon}<span>{label}</span>{badge && <em>{badge}</em>}</button>; }

export function ThemePanel({ theme, onChange, onClose }: { theme: ThemeConfig; onChange: (theme: ThemeConfig) => void; onClose: () => void }) {
  const update = (key: keyof ThemeConfig, value: string) => onChange({ ...theme, [key]: value });
  return <aside className="theme-panel"><div className="theme-panel-head"><div><label>STUDIO CUSTOMIZATION</label><h2>Make it yours</h2></div><button className="icon-button" onClick={onClose} title="Close customization"><X size={17}/></button></div><label className="theme-field-label">Brand name</label><input value={theme.brandName} onChange={e => update('brandName', e.target.value)} placeholder="Your studio name"/><label className="theme-field-label">Logo image URL</label><input value={theme.logoUrl} onChange={e => update('logoUrl', e.target.value)} placeholder="https://... (optional)"/><div className="theme-inline"><div><label className="theme-field-label">Logo mark</label><input maxLength={2} value={theme.logoMark} onChange={e => update('logoMark', e.target.value)} /></div><div><label className="theme-field-label">Primary</label><input className="color-input" type="color" value={theme.primary} onChange={e => update('primary', e.target.value)} /></div></div><div className="theme-inline"><div><label className="theme-field-label">Sidebar</label><input className="color-input" type="color" value={theme.sidebar} onChange={e => update('sidebar', e.target.value)} /></div><div><label className="theme-field-label">Surface</label><input className="color-input" type="color" value={theme.surface} onChange={e => update('surface', e.target.value)} /></div></div><button className="theme-reset" onClick={() => onChange(defaultTheme)}>Reset to Halo theme</button></aside>;
}

function QuickGuide({ role, onClose }: { role: Role; onClose: () => void }) {
  const steps = role === 'admin' ? [['01', 'Start with the person', 'Open New consultation and capture the guest’s goal, length, and texture.'], ['02', 'Capture the full picture', 'Use the guided front, left, right, and optional back scan.'], ['03', 'Review together', 'Use the report, service suggestions, and try-on as conversation starters.'], ['04', 'Keep the relationship', 'Save decisions, notes, favorites, and service history in Hair Passport.']] : [['01', 'Choose a service', 'Select the appointment type that best matches what you want to discuss.'], ['02', 'Request a time', 'Choose a preferred date, time, stylist, and add useful notes.'], ['03', 'Wait for confirmation', 'Your request appears under My appointments while the studio confirms it.'], ['04', 'Build your passport', 'Your saved styles and visit history help future consultations feel familiar.']];
  return <div className="guide-backdrop" onClick={onClose}><section className="quick-guide-panel" onClick={event => event.stopPropagation()}><div className="theme-panel-head"><div><label>{role === 'admin' ? 'STYLIST WORKSPACE' : 'GUEST WORKSPACE'}</label><h2>How Halo works</h2></div><button className="icon-button" onClick={onClose} title="Close guide"><X size={17}/></button></div><p className="guide-intro">A calm path from context to a more confident hair decision.</p>{steps.map(step => <div className="guide-step" key={step[0]}><span>{step[0]}</span><div><b>{step[1]}</b><p>{step[2]}</p></div></div>)}<button className="primary wide" onClick={onClose}>Got it</button></section></div>;
}

function NotificationPanel({ role, notifications, onClose }: { role: Role; notifications: Appointment[]; onClose: () => void }) {
  return <div className="notification-panel"><div className="theme-panel-head"><div><label>{role === 'admin' ? 'STUDIO NOTIFICATIONS' : 'APPOINTMENT UPDATES'}</label><h2>{notifications.length ? `${notifications.length} new request${notifications.length === 1 ? '' : 's'}` : 'All caught up'}</h2></div><button className="icon-button" onClick={onClose} title="Close notifications"><X size={17}/></button></div>{notifications.length === 0 ? <p className="notification-empty">New appointment requests will appear here.</p> : notifications.map(appointment => <div className="notification-item" key={appointment.id}><span className="notification-dot"/><div><b>{appointment.service}</b><p>{appointment.date} · {appointment.time} · {appointment.stylist}</p><small>{role === 'admin' ? 'Guest appointment request' : appointment.status}</small></div></div>)}</div>;
}

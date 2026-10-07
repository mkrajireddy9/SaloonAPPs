import { useEffect, useState } from 'react';
import { StudioLayout, type View } from './components/StudioLayout';
import { TodayScreen } from './screens/TodayScreen';
import { IntakeScreen } from './screens/IntakeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ReportScreen } from './screens/ReportScreen';
import { PassportScreen } from './screens/PassportScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { SalonDirectoryScreen } from './screens/SalonDirectoryScreen';
import { AdminStudioScreen } from './screens/AdminStudioScreen';
import { SalonSetupScreen } from './screens/SalonSetupScreen';
import { ToolsScreen } from './screens/ToolsScreen';
import { PriceListScreen } from './screens/PriceListScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import type { Appointment, Consultation, DashboardFilters, DashboardSummary, Passport, PriceListItem, PublicSalon, Report, Role, SalonConfig } from './types';
import { clearAuthSession, request, rotateAccessToken, setAuthSession } from './api';
import { ToastProvider, useToast } from './components/Toast';
import { PasswordRecoveryScreen } from './screens/PasswordRecoveryScreen';

function AppContent() {
  const { showToast } = useToast();
  const [view, setView] = useState<View>('today');
  const [role, setRole] = useState<Role | null>(() => {
    try {
      const token = localStorage.getItem('halo-token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1])) as { role?: Role; exp?: number };
      return payload.exp && payload.exp * 1000 < Date.now() ? null : payload.role || null;
    } catch {
      return null;
    }
  });
  const [loginError, setLoginError] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [report, setReport] = useState<Report>({} as Report);
  const [scanImage, setScanImage] = useState('');
  const emptyAnalytics = { totalBookings: 0, confirmedBookings: 0, requestedBookings: 0, cancelledBookings: 0, revenue: 0, cancellationRate: 0, byDate: [], byBranch: [], byService: [], byStylist: [], statusBreakdown: [] };
  const [dashboard, setDashboard] = useState<DashboardSummary>({ consultations: 0, serviceConversion: 0, averageVisitValue: 0, customers: [], services: [], recentConsultations: [], analytics: emptyAnalytics });
  const [passport, setPassport] = useState<Passport>({ id: '', ownerEmail: '', guestName: '', location: '', texture: '', length: '', preferredStylist: '', preferences: [], notes: '', styles: [], history: [], beforeImage: '', afterImage: '' });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [salon, setSalon] = useState<SalonConfig>({ name: '', location: '', services: [], stylists: [], openingHours: { open: '09:00', close: '19:00' }, closedDays: [] });
  const [salons, setSalons] = useState<PublicSalon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState('');
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  useEffect(() => { let cancelled = false; const restore = async () => { try { const parseRole = (value: string | null) => { if (!value) return null; const payload = JSON.parse(atob(value.split('.')[1])) as { role?: Role; exp?: number }; return payload.exp && payload.exp * 1000 > Date.now() ? payload.role || null : null; }; let restored = parseRole(localStorage.getItem('halo-token')); if (!restored && await rotateAccessToken()) restored = parseRole(localStorage.getItem('halo-token')); if (!cancelled) { setRole(restored); setAuthReady(true); } } catch { if (!cancelled) { clearAuthSession(); setRole(null); setAuthReady(true); } } }; void restore(); return () => { cancelled = true; }; }, []);
  const routeForView = (next: View) => next === 'today' ? '/' : `/${next}`;
  const viewForPath = (path: string): View => {
    const candidate = path.replace(/^\//, '') as View;
    return ['today', 'new', 'scan', 'report', 'passport', 'appointments', 'salons', 'studio', 'salon', 'price-list', 'products', 'tools', 'customers', 'account'].includes(candidate) ? candidate : 'today';
  };
  const navigate = (next: View, replace = false) => {
    setView(next);
    const url = routeForView(next);
    if (window.location.pathname !== url) window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  };
  useEffect(() => {
    const syncView = () => setView(viewForPath(window.location.pathname));
    syncView();
    window.addEventListener('popstate', syncView);
    return () => window.removeEventListener('popstate', syncView);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }, [view]);
  const refreshAppointments = async () => { try { setAppointments(await request<Appointment[]>('/appointments')); } catch { setAppointments([]); } };
  const refreshSalon = async () => { try { setSalon(await request<SalonConfig>('/salon')); } catch { setSalon(current => current); } };
  const refreshSalons = async () => { try { let query = ''; if (typeof navigator !== 'undefined' && navigator.geolocation) { const position = await new Promise<GeolocationPosition | null>(resolve => navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 })); if (position) query = `?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&radiusKm=25`; } setSalons(await request<PublicSalon[]>(`/salon/directory${query}`)); } catch { setSalons([]); } };
  const refreshPriceList = async () => { try { setPriceList(await request<PriceListItem[]>('/salon/price-list')); } catch { setPriceList([]); } };
  const refreshPassport = async () => { try { setPassport(await request<Passport>('/passport')); } catch { setPassport(current => ({ ...current, styles: [], history: [], preferences: [], notes: '', beforeImage: '', afterImage: '' })); } };
  const refreshDashboard = async (filters?: Partial<DashboardFilters>) => { try { const query = filters ? `?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)])).toString()}` : ''; setDashboard(await request<DashboardSummary>(`/dashboard/summary${query}`)); } catch { setDashboard({ consultations: 0, serviceConversion: 0, averageVisitValue: 0, customers: [], services: [], recentConsultations: [], analytics: emptyAnalytics }); } };
  useEffect(() => { if (role) { if (role === 'user' && window.location.pathname === '/') navigate('salons', true); void refreshAppointments(); void refreshPassport(); if (role === 'user') void refreshSalons(); if (role === 'admin') { void refreshSalon(); void refreshPriceList(); void refreshDashboard(); } } }, [role]);
  const selectSalon = async (id: string) => { try { const selected = await request<SalonConfig>(`/salon/${id}`); setSelectedSalonId(id); setSalon(selected); setPriceList(selected.serviceDetails || []); navigate('appointments'); } catch { showToast('Could not load that salon.', 'error'); } };
  useEffect(() => { if (!role) return; const timer = window.setInterval(() => { void refreshAppointments(); }, 5000); return () => window.clearInterval(timer); }, [role]);
  useEffect(() => { if (!role) return; void request('/auth/heartbeat', { method: 'POST' }).catch(() => undefined); const timer = window.setInterval(() => { void request('/auth/heartbeat', { method: 'POST' }).catch(() => undefined); }, 60000); return () => window.clearInterval(timer); }, [role]);
  const authenticate = async (email: string, password: string, selectedRole: Role, loginTheme?: Record<string, string>) => { setLoginError(''); if (!email.trim() || !password) { setLoginError('Enter your email and password to continue.'); return; } try { const credentials = { email: email.trim(), password, role: selectedRole }; const result = await request<{ accessToken: string; refreshToken: string; user: { role: Role } }>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); setAuthSession(result.accessToken, result.refreshToken); if (result.user.role === 'admin' && loginTheme) await request('/salon/theme', { method: 'PUT', body: JSON.stringify(loginTheme) }); setRole(result.user.role); navigate(result.user.role === 'admin' ? 'today' : 'salons', true); } catch { clearAuthSession(); setLoginError('We could not sign you in. Check your details and try again.'); } };
  const authenticateGoogle = async (credential: string, selectedRole: Role) => { setLoginError(''); try { const result = await request<{ accessToken: string; refreshToken: string; user: { role: Role } }>('/auth/google', { method: 'POST', body: JSON.stringify({ credential, role: selectedRole }) }); setAuthSession(result.accessToken, result.refreshToken); setRole(result.user.role); navigate(result.user.role === 'admin' ? 'today' : 'salons', true); } catch (error) { clearAuthSession(); setLoginError(error instanceof Error ? error.message : 'Google sign-in could not be completed. Please try again.'); } };
  const startConsultation = async (data: Partial<Consultation>) => { setScanImage(''); try { setConsultation(await request<Consultation>('/consultations', { method: 'POST', body: JSON.stringify(data) })); setView('scan'); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not start the consultation.', 'error'); } };
  const captureConsultationView = async (viewName: string) => { if (!consultation || viewName === 'back') return; try { setConsultation(await request<Consultation>(`/consultations/${consultation.id}/capture`, { method: 'POST', body: JSON.stringify({ view: viewName }) })); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not save this captured view.', 'error'); } };
  const checkImageQuality = async (imageBase64: string) => request<{ passed: boolean; score: number; retakeGuidance: string[] }>('/ai/quality-check', { method: 'POST', body: JSON.stringify({ view: 'front', imageBase64 }) });
  const generateTryOn = async (styleName: string, provider: 'gemini' | 'pollinations' = 'pollinations') => request<{ previewImage: string }>('/ai/try-on', { method: 'POST', body: JSON.stringify({ styleName, provider, imageBase64: scanImage || undefined }) });
  const finishScan = async () => { if (!consultation) return; try { const saved = await request<Consultation>(`/consultations/${consultation.id}/analyze`, { method: 'POST', body: JSON.stringify(scanImage ? { imageBase64: scanImage } : {}) }); if (!saved.report) throw new Error('The consultation report was not returned by the API.'); setConsultation(saved); setReport(saved.report as Report); setView('report'); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not analyze this consultation.', 'error'); } };
  const saveConsultationResult = async (data: { selectedStyle: string; selectedServices: string[]; afterImage: string }) => { if (!consultation) return; const saved = await request<Consultation>(`/consultations/${consultation.id}/save`, { method: 'POST', body: JSON.stringify(data) }); setConsultation(saved); await request('/passport', { method: 'PUT', body: JSON.stringify({ beforeImage: saved.beforeImage ? `data:image/jpeg;base64,${saved.beforeImage}` : '', afterImage: data.afterImage }) }); await refreshPassport(); await refreshDashboard(); };
  const confirmAppointment = (id: string) => setAppointments(items => items.map(item => item.id === id ? { ...item, status: 'Confirmed' } : item));
  const createAppointment = async (appointment: Appointment) => { const saved = await request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify({ ...appointment, salonId: appointment.salonId || salon.id }) }); setAppointments(items => [saved, ...items]); };
  const cancelAppointment = async (id: string) => { const saved = await request<Appointment>(`/appointments/${id}/cancel`, { method: 'PATCH' }); setAppointments(items => items.map(item => item.id === id ? saved : item)); };
  const rescheduleAppointment = async (id: string, date: string, time: string) => { const saved = await request<Appointment>(`/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ date, time }) }); setAppointments(items => items.map(item => item.id === id ? saved : item)); };
  const confirmAppointmentWithApi = async (id: string) => { await request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Confirmed' }) }); await refreshAppointments(); };
  const saveSalon = async (config: SalonConfig) => { const saved = await request<SalonConfig>('/salon', { method: 'PUT', body: JSON.stringify(config) }); setSalon(saved); };
  const savePriceList = async (items: PriceListItem[]) => { const saved = await request<PriceListItem[]>('/salon/price-list', { method: 'PUT', body: JSON.stringify({ items }) }); setPriceList(saved); setSalon(current => ({ ...current, services: saved.map(item => item.name), serviceDetails: saved })); };
  const saveProducts = async (products: import('./types').ProductItem[]) => { const saved = await request<SalonConfig>('/salon', { method: 'PUT', body: JSON.stringify({ ...salon, products }) }); setSalon(saved); };
  const savePassport = async (changes: Partial<Passport>) => { const saved = await request<Passport>('/passport', { method: 'PUT', body: JSON.stringify(changes) }); setPassport(saved); };
  if (!authReady) return <div className="auth-loading" aria-label="Restoring your session" />;
  if (!role) { const path = window.location.pathname; if (path === '/forgot-password') return <PasswordRecoveryScreen mode="forgot" onBack={() => { window.history.pushState({}, '', '/'); window.location.reload(); }} />; if (path === '/reset-password') return <PasswordRecoveryScreen mode="reset" onBack={() => { window.history.pushState({}, '', '/'); window.location.reload(); }} />; if (path === '/verify-email') return <PasswordRecoveryScreen mode="verify" onBack={() => { window.history.pushState({}, '', '/'); window.location.reload(); }} />; return <LoginScreen onLogin={authenticate} onGoogleLogin={authenticateGoogle} error={loginError}/>; }
  return <ToastProvider><StudioLayout view={view} setView={navigate} role={role} guestSalonSelected={role === 'admin' || Boolean(selectedSalonId)} onLogout={() => { clearAuthSession(); setRole(null); navigate('today', true); }} notifications={appointments}>{role === 'admin' && view === 'today' && <TodayScreen onNew={() => navigate('new')} onPassport={() => navigate('passport')} onStudioData={() => navigate('studio')} appointments={appointments} onConfirmAppointment={confirmAppointmentWithApi}/>} {role === 'admin' && view === 'studio' && <><AdminStudioScreen data={dashboard} onBack={() => navigate('today')} onOpenPassport={() => navigate('passport')} onOpenSalon={() => navigate('salon')} onFilterChange={refreshDashboard}/><ToolsScreen role="admin" appointments={appointments}/></>} {role === 'admin' && view === 'customers' && <CustomersScreen role="admin" salon={salon} onBack={() => navigate('studio')}/>} {role === 'admin' && view === 'salon' && <SalonSetupScreen config={salon} onBack={() => navigate('studio')} onSave={saveSalon}/>} {role === 'admin' && view === 'price-list' && <PriceListScreen role="admin" items={priceList} onBack={() => navigate('studio')} onSave={savePriceList}/>} {role === 'admin' && view === 'products' && <ProductsScreen role="admin" products={salon.products || []} onBack={() => navigate('studio')} onSave={saveProducts}/>} {role === 'admin' && view === 'new' && <IntakeScreen onBack={() => navigate('today')} onStart={startConsultation}/>} {role === 'admin' && view === 'scan' && consultation && <ScanScreen consultation={consultation} onBack={() => navigate('new')} onCapture={captureConsultationView} onDone={finishScan} onImage={setScanImage} onQualityCheck={checkImageQuality}/>} {role === 'admin' && view === 'report' && consultation && <ReportScreen consultation={consultation} report={report} onBack={() => navigate('scan')} onSave={saveConsultationResult} onGeneratePreview={generateTryOn}/>} {role === 'admin' && view === 'passport' && <PassportScreen passport={passport} onBack={() => navigate('today')} onSave={savePassport} onNew={() => navigate('new')}/>} {role === 'user' && view === 'salons' && <SalonDirectoryScreen salons={salons} selectedSalonId={selectedSalonId} onSelect={selectSalon}/>} {role === 'user' && view === 'appointments' && selectedSalonId && <><AppointmentsScreen appointments={appointments} onCreate={createAppointment} onCancel={cancelAppointment} onReschedule={rescheduleAppointment} salon={salon} /><ToolsScreen role="user" appointments={appointments}/></>} {role === 'user' && view !== 'salons' && !selectedSalonId && <SalonDirectoryScreen salons={salons} selectedSalonId={selectedSalonId} onSelect={selectSalon}/>} {role === 'user' && view === 'account' && <CustomersScreen role="user" salon={salon} onBack={() => navigate('appointments')}/>} {role === 'user' && selectedSalonId && view === 'price-list' && <PriceListScreen role="user" items={priceList} onBack={() => navigate('appointments')}/>} {role === 'user' && selectedSalonId && view === 'products' && <ProductsScreen role="user" products={salon.products || []} onBack={() => navigate('appointments')}/>}</StudioLayout></ToastProvider>;
}

export function App() {
  return <ToastProvider><AppContent /></ToastProvider>;
}

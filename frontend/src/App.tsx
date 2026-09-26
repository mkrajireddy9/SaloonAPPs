import { useEffect, useState } from 'react';
import { StudioLayout, type View } from './components/StudioLayout';
import { defaultSalonConfig, dummyReport } from './data/dummy';
import { TodayScreen } from './screens/TodayScreen';
import { IntakeScreen } from './screens/IntakeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ReportScreen } from './screens/ReportScreen';
import { PassportScreen } from './screens/PassportScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { AdminStudioScreen } from './screens/AdminStudioScreen';
import { SalonSetupScreen } from './screens/SalonSetupScreen';
import type { Appointment, Consultation, Report, Role, SalonConfig } from './types';
import { clearAuthToken, request, setAuthToken } from './api';

export function App() {
  const [view, setView] = useState<View>('today');
  const [role, setRole] = useState<Role | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(() => { try { return JSON.parse(localStorage.getItem('halo-appointments') || '[]') as Appointment[]; } catch { return []; } });
  const [salon, setSalon] = useState<SalonConfig>(() => { try { return { ...defaultSalonConfig, ...JSON.parse(localStorage.getItem('halo-salon') || '{}') }; } catch { return defaultSalonConfig; } });
  const refreshAppointments = async () => { try { setAppointments(await request<Appointment[]>('/appointments')); } catch { /* Keep local dummy data while the API/database is unavailable. */ } };
  const refreshSalon = async () => { try { const saved = await request<SalonConfig>('/salon'); setSalon(saved); } catch { /* Keep the local salon catalog while the API/database is unavailable. */ } };
  useEffect(() => { if (role) { void refreshAppointments(); void refreshSalon(); } }, [role]);
  useEffect(() => { localStorage.setItem('halo-salon', JSON.stringify(salon)); }, [salon]);
  useEffect(() => { localStorage.setItem('halo-appointments', JSON.stringify(appointments)); }, [appointments]);
  const authenticate = async (email: string, password: string, selectedRole: Role) => { try { const result = await request<{ accessToken: string; user: { role: Role } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setAuthToken(result.accessToken); setRole(result.user.role); setView(result.user.role === 'admin' ? 'today' : 'appointments'); } catch { clearAuthToken(); setRole(selectedRole); setView(selectedRole === 'admin' ? 'today' : 'appointments'); } };
  const startConsultation = async (data: Partial<Consultation>) => { const draft = { id: `demo-${Date.now()}`, guestName: data.guestName || 'New guest', phone: data.phone || '', stylist: data.stylist || 'Meera Nair', goal: data.goal || 'A cut that feels like me', length: data.length || 'Shoulder length', texture: data.texture || 'Wavy', capturedViews: '', report: null, status: 'draft' } as Consultation; try { setConsultation(await request<Consultation>('/consultations', { method: 'POST', body: JSON.stringify(data) })); } catch { setConsultation(draft); } setView('scan'); };
  const captureConsultationView = async (viewName: string) => { if (!consultation || viewName === 'back') return; try { setConsultation(await request<Consultation>(`/consultations/${consultation.id}/capture`, { method: 'POST', body: JSON.stringify({ view: viewName }) })); } catch { /* The local scan state remains the fallback. */ } };
  const finishScan = async () => { if (!consultation) return; try { const saved = await request<Consultation>(`/consultations/${consultation.id}/analyze`, { method: 'POST' }); setConsultation(saved); setReport((saved.report as Report) || dummyReport); } catch { setReport(dummyReport); } setView('report'); };
  const confirmAppointment = (id: string) => setAppointments(items => items.map(item => item.id === id ? { ...item, status: 'Confirmed' } : item));
  const createAppointment = async (appointment: Appointment) => { setAppointments(items => [appointment, ...items]); try { const saved = await request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(appointment) }); setAppointments(items => [saved, ...items.filter(item => item.id !== appointment.id)]); } catch { /* Local appointment remains visible as a dummy fallback. */ } };
  const confirmAppointmentWithApi = async (id: string) => { confirmAppointment(id); try { await request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Confirmed' }) }); } catch { /* Local confirmation remains available without the API. */ } };
  const saveSalon = async (config: SalonConfig) => { setSalon(config); try { const saved = await request<SalonConfig>('/salon', { method: 'PUT', body: JSON.stringify(config) }); setSalon(saved); } catch { /* Local salon data remains available while API authentication is unavailable. */ } };
  if (!role) return <LoginScreen onLogin={authenticate}/>;
  return <StudioLayout view={view} setView={setView} role={role} onLogout={() => { clearAuthToken(); setRole(null); }} notifications={appointments}>{role === 'admin' && view === 'today' && <TodayScreen onNew={() => setView('new')} onPassport={() => setView('passport')} onStudioData={() => setView('studio')} appointments={appointments} onConfirmAppointment={confirmAppointmentWithApi}/>} {role === 'admin' && view === 'studio' && <AdminStudioScreen onOpenPassport={() => setView('passport')} onOpenSalon={() => setView('salon')}/>} {role === 'admin' && view === 'salon' && <SalonSetupScreen config={salon} onSave={saveSalon}/>} {role === 'admin' && view === 'new' && <IntakeScreen onBack={() => setView('today')} onStart={startConsultation}/>} {role === 'admin' && view === 'scan' && consultation && <ScanScreen consultation={consultation} onBack={() => setView('new')} onCapture={captureConsultationView} onDone={finishScan}/>} {role === 'admin' && view === 'report' && consultation && report && <ReportScreen consultation={consultation} report={report} onBack={() => setView('scan')}/>} {role === 'admin' && view === 'passport' && <PassportScreen onNew={() => setView('new')}/>} {role === 'user' && view === 'appointments' && <AppointmentsScreen appointments={appointments} onCreate={createAppointment} salon={salon}/>}</StudioLayout>;
}

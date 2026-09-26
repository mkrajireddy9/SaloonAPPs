import { useEffect, useState } from 'react';
import { StudioLayout, type View } from './components/StudioLayout';
import { dummyReport } from './data/dummy';
import { TodayScreen } from './screens/TodayScreen';
import { IntakeScreen } from './screens/IntakeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ReportScreen } from './screens/ReportScreen';
import { PassportScreen } from './screens/PassportScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { AdminStudioScreen } from './screens/AdminStudioScreen';
import type { Appointment, Consultation, Report, Role } from './types';
import { request } from './api';

export function App() {
  const [view, setView] = useState<View>('today');
  const [role, setRole] = useState<Role | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const refreshAppointments = async () => { try { const remote = await request<Appointment[]>('/appointments'); setAppointments(remote); } catch { /* Keep local dummy data while the API/database is unavailable. */ } };
  useEffect(() => { if (role) void refreshAppointments(); }, [role]);
  const startConsultation = (data: Partial<Consultation>) => {
    setConsultation({ id: `demo-${Date.now()}`, guestName: data.guestName || 'New guest', phone: data.phone || '', stylist: data.stylist || 'Meera Nair', goal: data.goal || 'A cut that feels like me', length: data.length || 'Shoulder length', texture: data.texture || 'Wavy', capturedViews: '', report: null, status: 'draft' });
    setView('scan');
  };
  const finishScan = () => { if (!consultation) return; setReport(dummyReport); setView('report'); };
  const confirmAppointment = (id: string) => setAppointments(items => items.map(item => item.id === id ? { ...item, status: 'Confirmed' } : item));
  const createAppointment = async (appointment: Appointment) => { setAppointments(items => [appointment, ...items]); try { const saved = await request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(appointment) }); setAppointments(items => [saved, ...items.filter(item => item.id !== appointment.id)]); } catch { /* Local appointment remains visible as a dummy fallback. */ } };
  const confirmAppointmentWithApi = async (id: string) => { confirmAppointment(id); try { await request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Confirmed' }) }); } catch { /* Local confirmation remains available without the API. */ } };
  if (!role) return <LoginScreen onLogin={nextRole => { setRole(nextRole); setView(nextRole === 'admin' ? 'today' : 'appointments'); }}/>;
  return <StudioLayout view={view} setView={setView} role={role} onLogout={() => setRole(null)} notifications={appointments}>{role === 'admin' && view === 'today' && <TodayScreen onNew={() => setView('new')} onPassport={() => setView('passport')} onStudioData={() => setView('studio')} appointments={appointments} onConfirmAppointment={confirmAppointmentWithApi}/>} {role === 'admin' && view === 'studio' && <AdminStudioScreen onOpenPassport={() => setView('passport')}/>} {role === 'admin' && view === 'new' && <IntakeScreen onBack={() => setView('today')} onStart={startConsultation}/>} {role === 'admin' && view === 'scan' && consultation && <ScanScreen consultation={consultation} onBack={() => setView('new')} onDone={finishScan}/>} {role === 'admin' && view === 'report' && consultation && report && <ReportScreen consultation={consultation} report={report} onBack={() => setView('scan')}/>} {role === 'admin' && view === 'passport' && <PassportScreen onNew={() => setView('new')}/>} {role === 'user' && view === 'appointments' && <AppointmentsScreen appointments={appointments} onCreate={createAppointment}/>}</StudioLayout>;
}

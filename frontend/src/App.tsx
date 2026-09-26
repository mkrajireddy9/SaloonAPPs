import { useState } from 'react';
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

export function App() {
  const [view, setView] = useState<View>('today');
  const [role, setRole] = useState<Role | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const startConsultation = (data: Partial<Consultation>) => {
    setConsultation({ id: `demo-${Date.now()}`, guestName: data.guestName || 'New guest', phone: data.phone || '', stylist: data.stylist || 'Meera Nair', goal: data.goal || 'A cut that feels like me', length: data.length || 'Shoulder length', texture: data.texture || 'Wavy', capturedViews: '', report: null, status: 'draft' });
    setView('scan');
  };
  const finishScan = () => { if (!consultation) return; setReport(dummyReport); setView('report'); };
  if (!role) return <LoginScreen onLogin={nextRole => { setRole(nextRole); setView(nextRole === 'admin' ? 'today' : 'appointments'); }}/>;
  return <StudioLayout view={view} setView={setView} role={role} onLogout={() => setRole(null)}>{role === 'admin' && view === 'today' && <TodayScreen onNew={() => setView('new')} onPassport={() => setView('passport')} onStudioData={() => setView('studio')}/>} {role === 'admin' && view === 'studio' && <AdminStudioScreen onOpenPassport={() => setView('passport')}/>} {role === 'admin' && view === 'new' && <IntakeScreen onBack={() => setView('today')} onStart={startConsultation}/>} {role === 'admin' && view === 'scan' && consultation && <ScanScreen consultation={consultation} onBack={() => setView('new')} onDone={finishScan}/>} {role === 'admin' && view === 'report' && consultation && report && <ReportScreen consultation={consultation} report={report} onBack={() => setView('scan')}/>} {role === 'admin' && view === 'passport' && <PassportScreen onNew={() => setView('new')}/>} {role === 'user' && view === 'appointments' && <AppointmentsScreen appointments={appointments} onCreate={appointment => setAppointments([appointment, ...appointments])}/>}</StudioLayout>;
}

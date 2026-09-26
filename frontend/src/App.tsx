import { useState } from 'react';
import { StudioLayout, type View } from './components/StudioLayout';
import { dummyReport } from './data/dummy';
import { TodayScreen } from './screens/TodayScreen';
import { IntakeScreen } from './screens/IntakeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ReportScreen } from './screens/ReportScreen';
import { PassportScreen } from './screens/PassportScreen';
import type { Consultation, Report } from './types';

export function App() {
  const [view, setView] = useState<View>('today');
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const startConsultation = (data: Partial<Consultation>) => {
    setConsultation({ id: `demo-${Date.now()}`, guestName: data.guestName || 'New guest', phone: data.phone || '', stylist: data.stylist || 'Meera Nair', goal: data.goal || 'A cut that feels like me', length: data.length || 'Shoulder length', texture: data.texture || 'Wavy', capturedViews: '', report: null, status: 'draft' });
    setView('scan');
  };
  const finishScan = () => { if (!consultation) return; setReport(dummyReport); setView('report'); };
  return <StudioLayout view={view} setView={setView}>{view === 'today' && <TodayScreen onNew={() => setView('new')} onPassport={() => setView('passport')}/>} {view === 'new' && <IntakeScreen onBack={() => setView('today')} onStart={startConsultation}/>} {view === 'scan' && consultation && <ScanScreen consultation={consultation} onBack={() => setView('new')} onDone={finishScan}/>} {view === 'report' && consultation && report && <ReportScreen consultation={consultation} report={report} onBack={() => setView('scan')}/>} {view === 'passport' && <PassportScreen onNew={() => setView('new')}/>}</StudioLayout>;
}

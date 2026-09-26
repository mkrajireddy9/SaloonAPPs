export type Consultation = { id: string; guestName: string; phone: string; stylist: string; goal: string; length: string; texture: string; capturedViews: string; report: Report | null; status: string; };
export type Report = { faceShape: string; texture: string; length: string; density: string; movement: string; visibleCondition: string; signals: { label: string; level: string; note: string }[]; recommendations: { name: string; score: number; tag: string; description: string; chips: string[] }[]; services: { name: string; reason: string }[] };
export type Role = 'admin' | 'user';
export type Appointment = { id: string; guestName?: string; guestEmail?: string; service: string; date: string; time: string; stylist: string; status: 'Confirmed' | 'Requested'; notes: string };

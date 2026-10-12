export type Role = 'user' | 'admin';
export type Salon = { id: string; name: string; location: string; services?: string[]; stylists?: string[]; serviceDetails?: Array<{ name: string; price: number; durationMinutes: number }>; products?: Array<{ id: string; name: string; description?: string }> };
export type Appointment = { id: string; salonId?: string; service: string; date: string; time: string; stylist: string; status: 'Requested' | 'Confirmed' | 'Cancelled'; price?: number };
export type DashboardSummary = { consultations: number; customers: number; averageVisitValue: number; recentConsultations: unknown[] };

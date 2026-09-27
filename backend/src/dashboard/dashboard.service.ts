import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Consultation } from '../consultations/consultation.entity';
import { User, UserRole } from '../auth/user.entity';
import { Salon } from '../salon/salon.entity';

@Injectable()
export class DashboardService {
  constructor(@InjectRepository(Appointment) private readonly appointments: Repository<Appointment>, @InjectRepository(Consultation) private readonly consultations: Repository<Consultation>, @InjectRepository(User) private readonly users: Repository<User>, @InjectRepository(Salon) private readonly salons: Repository<Salon>) {}

  async summary(query: { dateFrom?: string; dateTo?: string; branchId?: string; service?: string; stylist?: string; status?: string } = {}) {
    const [appointments, consultations, customers, salon] = await Promise.all([
      this.appointments.find({ order: { createdAt: 'DESC' } }),
      this.consultations.find({ order: { createdAt: 'DESC' } }),
      this.users.find({ where: { role: UserRole.USER }, order: { createdAt: 'DESC' } }),
      this.salons.findOne({ where: {} }),
    ]);
    const filtered = appointments.filter(item => (!query.dateFrom || item.date >= query.dateFrom) && (!query.dateTo || item.date <= query.dateTo) && (!query.branchId || item.branchId === query.branchId) && (!query.service || item.service === query.service) && (!query.stylist || item.stylist === query.stylist) && (!query.status || item.status === query.status));
    const completed = filtered.filter(item => item.status === 'Confirmed').length;
    const cancelled = filtered.filter(item => item.status === 'Cancelled').length;
    const revenue = filtered.filter(item => item.status === 'Confirmed').reduce((total, item) => total + Number(item.price || 0), 0);
    const serviceCounts = filtered.reduce<Record<string, number>>((result, item) => { result[item.service] = (result[item.service] || 0) + 1; return result; }, {});
    const group = (key: (item: typeof filtered[number]) => string) => Object.values(filtered.reduce<Record<string, { name: string; bookings: number; confirmed: number; cancelled: number; requested: number; revenue: number; durationMinutes: number }>>((result, item) => { const name = key(item) || 'Unassigned'; const current = result[name] || { name, bookings: 0, confirmed: 0, cancelled: 0, requested: 0, revenue: 0, durationMinutes: 0 }; current.bookings += 1; current.confirmed += item.status === 'Confirmed' ? 1 : 0; current.cancelled += item.status === 'Cancelled' ? 1 : 0; current.requested += item.status === 'Requested' ? 1 : 0; current.revenue += item.status === 'Confirmed' ? Number(item.price || 0) : 0; current.durationMinutes += Number(item.durationMinutes || 0); result[name] = current; return result; }, {}));
    const byDate = group(item => item.date).map(item => ({ ...item, date: item.name })).sort((a, b) => a.date.localeCompare(b.date));
    const byBranch = group(item => item.branchId).map(item => ({ ...item, id: item.name, name: salon?.branches?.find(branch => branch.id === item.name)?.name || item.name }));
    const byService = group(item => item.service);
    const byStylist = group(item => item.stylist).map(item => ({ ...item, conversionRate: item.bookings ? Math.round((item.confirmed / item.bookings) * 100) : 0, averageDurationMinutes: item.bookings ? Math.round(item.durationMinutes / item.bookings) : 0 }));
    const statusBreakdown = ['Requested', 'Confirmed', 'Cancelled'].map(status => ({ status, count: filtered.filter(item => item.status === status).length }));
    return {
      consultations: consultations.length,
      serviceConversion: consultations.length ? Math.round((completed / consultations.length) * 100) : 0,
      averageVisitValue: completed ? Math.round(revenue / completed) : 0,
      customers: customers.map(customer => ({ name: customer.name, profile: 'Guest profile', last: filtered.find(item => item.guestEmail === customer.email)?.date || 'No visits yet', visits: filtered.filter(item => item.guestEmail === customer.email).length })),
      services: (salon?.services || Object.keys(serviceCounts)).map(name => ({ name, bookings: serviceCounts[name] || 0, revenue: `₹${byService.find(item => item.name === name)?.revenue || 0}` })),
      recentAppointments: filtered.slice(0, 5),
      recentConsultations: consultations.slice(0, 8),
      analytics: { totalBookings: filtered.length, confirmedBookings: completed, requestedBookings: filtered.filter(item => item.status === 'Requested').length, cancelledBookings: cancelled, revenue, cancellationRate: filtered.length ? Math.round((cancelled / filtered.length) * 100) : 0, byDate, byBranch, byService, byStylist, statusBreakdown },
    };
  }
}

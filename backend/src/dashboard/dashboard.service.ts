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

  async summary() {
    const [appointments, consultations, customers, salon] = await Promise.all([
      this.appointments.find({ order: { createdAt: 'DESC' } }),
      this.consultations.find({ order: { createdAt: 'DESC' } }),
      this.users.find({ where: { role: UserRole.USER }, order: { createdAt: 'DESC' } }),
      this.salons.findOne({ where: {} }),
    ]);
    const completed = appointments.filter(item => item.status === 'Confirmed').length;
    const serviceCounts = appointments.reduce<Record<string, number>>((result, item) => { result[item.service] = (result[item.service] || 0) + 1; return result; }, {});
    return {
      consultations: consultations.length,
      serviceConversion: consultations.length ? Math.round((completed / consultations.length) * 100) : 0,
      averageVisitValue: completed ? 1840 : 0,
      customers: customers.map(customer => ({ name: customer.name, profile: 'Guest profile', last: appointments.find(item => item.guestEmail === customer.email)?.date || 'No visits yet', visits: appointments.filter(item => item.guestEmail === customer.email).length })),
      services: (salon?.services || Object.keys(serviceCounts)).map(name => ({ name, bookings: serviceCounts[name] || 0, revenue: `₹${(serviceCounts[name] || 0) * 1840}` })),
      recentAppointments: appointments.slice(0, 5),
      recentConsultations: consultations.slice(0, 8),
    };
  }
}

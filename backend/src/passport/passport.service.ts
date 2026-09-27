import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePassportDto } from './passport.dto';
import { Passport } from './passport.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class PassportService {
  constructor(@InjectRepository(Passport) private readonly repo: Repository<Passport>, @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>) {}

  async get(ownerEmail: string, ownerName?: string) {
    let passport = await this.repo.findOne({ where: { ownerEmail } });
    if (!passport) passport = await this.repo.save(this.repo.create({ ownerEmail, guestName: ownerName || ownerEmail.split('@')[0], styles: [], history: [], preferences: [], notes: '' }));
    const appointments = await this.appointments.find({ where: { guestEmail: ownerEmail }, order: { date: 'DESC', time: 'DESC' } });
    const appointmentHistory = appointments.map(item => ({ date: item.date, service: item.service, detail: `${item.stylist} · ${item.status}`, appointmentId: item.id }));
    return { ...passport, guestName: ownerName || passport.guestName, history: appointmentHistory };
  }

  async update(ownerEmail: string, dto: UpdatePassportDto, ownerName?: string) {
    const passport = await this.get(ownerEmail, ownerName);
    Object.assign(passport, dto);
    return this.repo.save(passport);
  }
}

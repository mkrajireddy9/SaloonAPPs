import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateAppointmentDto, RescheduleAppointmentDto, UpdateAppointmentStatusDto } from './appointment.dto';
import { Appointment } from './appointment.entity';
import { UserRole } from '../auth/user.entity';
import { Salon } from '../salon/salon.entity';

@Injectable()
export class AppointmentService {
  constructor(@InjectRepository(Appointment) private readonly repo: Repository<Appointment>, @InjectRepository(Salon) private readonly salons: Repository<Salon>) {}

  private async validateSlot(date: string, time: string) {
    const salon = await this.salons.findOne({ where: {} });
    if (!salon) return;
    const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    if ((salon.closedDays || []).includes(weekday)) throw new ConflictException(`The salon is closed on ${weekday}`);
    const toMinutes = (value: string) => { const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!match) return -1; let hour = Number(match[1]); const minute = Number(match[2]); const meridiem = match[3]?.toUpperCase(); if (meridiem === 'PM' && hour < 12) hour += 12; if (meridiem === 'AM' && hour === 12) hour = 0; return hour * 60 + minute; };
    const requested = toMinutes(time); const open = toMinutes(salon.openingHours?.open || '09:00'); const close = toMinutes(salon.openingHours?.close || '19:00');
    if (requested < 0 || requested < open || requested >= close) throw new ConflictException(`Appointments are available between ${salon.openingHours?.open || '09:00'} and ${salon.openingHours?.close || '19:00'}`);
  }

  findAll(user: { email: string; role: UserRole }) { return this.repo.find({ where: user.role === UserRole.ADMIN ? {} : { guestEmail: user.email }, order: { createdAt: 'DESC' } }); }

  async create(dto: CreateAppointmentDto, user: { email: string; name: string; role: UserRole }) {
    const stylist = dto.stylist || 'Meera Nair';
    if (new Date(`${dto.date}T00:00:00`).getTime() < new Date(new Date().toDateString()).getTime()) throw new ConflictException('Appointments must be scheduled for today or a future date');
    await this.validateSlot(dto.date, dto.time);
    const conflict = await this.repo.findOne({ where: { date: dto.date, time: dto.time, stylist, status: In(['Requested', 'Confirmed']) } });
    if (conflict) throw new ConflictException('That stylist is already requested for this time');
    return this.repo.save(this.repo.create({ ...dto, guestName: user.role === UserRole.USER ? user.name : (dto.guestName || 'Ananya Rao'), guestEmail: user.role === UserRole.USER ? user.email : (dto.guestEmail || ''), stylist, status: 'Requested' }));
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    appointment.status = dto.status;
    return this.repo.save(appointment);
  }

  async cancel(id: string, user: { email: string; role: UserRole }) {
    const appointment = await this.repo.findOne({ where: user.role === UserRole.ADMIN ? { id } : { id, guestEmail: user.email } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === 'Cancelled') return appointment;
    appointment.status = 'Cancelled';
    return this.repo.save(appointment);
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto, user: { email: string; role: UserRole }) {
    const appointment = await this.repo.findOne({ where: user.role === UserRole.ADMIN ? { id } : { id, guestEmail: user.email } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (appointment.status === 'Cancelled') throw new ConflictException('Cancelled appointments cannot be rescheduled');
    if (new Date(`${dto.date}T00:00:00`).getTime() < new Date(new Date().toDateString()).getTime()) throw new ConflictException('Appointments must be scheduled for today or a future date');
    await this.validateSlot(dto.date, dto.time);
    const conflict = await this.repo.findOne({ where: { date: dto.date, time: dto.time, stylist: appointment.stylist, status: In(['Requested', 'Confirmed']) } });
    if (conflict && conflict.id !== appointment.id) throw new ConflictException('That stylist is already requested for this time');
    appointment.date = dto.date;
    appointment.time = dto.time;
    appointment.status = 'Requested';
    return this.repo.save(appointment);
  }
}

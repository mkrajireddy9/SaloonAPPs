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

  private async validateSlot(date: string, time: string, durationMinutes = 30) {
    const salon = await this.salons.findOne({ where: {} });
    if (!salon) throw new ConflictException('Salon booking settings are not configured');
    const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    if ((salon.closedDays || []).includes(weekday)) throw new ConflictException(`The salon is closed on ${weekday}`);
    const toMinutes = (value: string) => { const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!match) return -1; let hour = Number(match[1]); const minute = Number(match[2]); const meridiem = match[3]?.toUpperCase(); if (meridiem === 'PM' && hour < 12) hour += 12; if (meridiem === 'AM' && hour === 12) hour = 0; return hour * 60 + minute; };
    const requested = toMinutes(time); const open = toMinutes(salon.openingHours?.open || '09:00'); const close = toMinutes(salon.openingHours?.close || '19:00');
    if (requested < 0 || requested < open || requested + durationMinutes > close) throw new ConflictException(`This appointment must fit between ${salon.openingHours?.open || '09:00'} and ${salon.openingHours?.close || '19:00'}`);
    return { salon, requested, open, close };
  }

  findAll(user: { email: string; role: UserRole }) { return this.repo.find({ where: user.role === UserRole.ADMIN ? {} : { guestEmail: user.email }, order: { createdAt: 'DESC' } }); }

  async create(dto: CreateAppointmentDto, user: { email: string; name: string; role: UserRole }) {
    const stylist = dto.stylist || 'Meera Nair';
    if (new Date(`${dto.date}T00:00:00`).getTime() < new Date(new Date().toDateString()).getTime()) throw new ConflictException('Appointments must be scheduled for today or a future date');
    const detail = (await this.salons.findOne({ where: {} }))?.serviceDetails?.find(item => item.name === dto.service);
    const slot = await this.validateSlot(dto.date, dto.time, detail?.durationMinutes || 60);
    const schedule = slot.salon.stylistSchedules?.[stylist];
    const weekday = new Date(`${dto.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    if (schedule && (!schedule.workingDays.includes(weekday) || schedule.leaveDates.includes(dto.date))) throw new ConflictException(`${stylist} is unavailable on this date`);
    const conflict = await this.repo.findOne({ where: { date: dto.date, time: dto.time, stylist, status: In(['Requested', 'Confirmed']) } });
    if (conflict) throw new ConflictException('That stylist is already requested for this time');
    return this.repo.save(this.repo.create({ ...dto, guestName: user.role === UserRole.USER ? user.name : (dto.guestName || 'Ananya Rao'), guestEmail: user.role === UserRole.USER ? user.email : (dto.guestEmail || ''), stylist, durationMinutes: detail?.durationMinutes || 60, price: detail?.price || 0, status: 'Requested' }));
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
    await this.validateSlot(dto.date, dto.time, appointment.durationMinutes || 60);
    const salon = await this.salons.findOne({ where: {} });
    const weekday = new Date(`${dto.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    const schedule = salon?.stylistSchedules?.[appointment.stylist];
    if ((salon?.closedDays || []).includes(weekday) || (schedule && (!schedule.workingDays.includes(weekday) || schedule.leaveDates.includes(dto.date)))) throw new ConflictException(`${appointment.stylist} is unavailable on this date`);
    const conflict = await this.repo.findOne({ where: { date: dto.date, time: dto.time, stylist: appointment.stylist, status: In(['Requested', 'Confirmed']) } });
    if (conflict && conflict.id !== appointment.id) throw new ConflictException('That stylist is already requested for this time');
    appointment.date = dto.date;
    appointment.time = dto.time;
    appointment.status = 'Requested';
    return this.repo.save(appointment);
  }

  async slots(date: string, stylist?: string, service?: string) {
    const salon = await this.salons.findOne({ where: {} });
    if (!salon) return [];
    const weekday = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
    if ((salon.closedDays || []).includes(weekday)) return [];
    const schedule = stylist ? salon.stylistSchedules?.[stylist] : undefined;
    if (schedule && (!schedule.workingDays.includes(weekday) || schedule.leaveDates.includes(date))) return [];
    const toMinutes = (value: string) => { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute; };
    const open = toMinutes(salon.openingHours.open); const close = toMinutes(salon.openingHours.close);
    const duration = salon.serviceDetails?.find(item => item.name === service)?.durationMinutes || 60;
    const booked = await this.repo.find({ where: { date, ...(stylist ? { stylist } : {}), status: In(['Requested', 'Confirmed']) } });
    const parseTime = (value: string) => { const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!match) return -1; let hour = Number(match[1]); const minute = Number(match[2]); const meridiem = match[3]?.toUpperCase(); if (meridiem === 'PM' && hour < 12) hour += 12; if (meridiem === 'AM' && hour === 12) hour = 0; return hour * 60 + minute; };
    const overlaps = (start: number) => booked.some(item => { const bookedStart = parseTime(item.time); return bookedStart >= 0 && start < bookedStart + (item.durationMinutes || 60) && start + duration > bookedStart; });
    const result: string[] = [];
    for (let minute = open; minute + duration <= close; minute += 30) { const hour24 = Math.floor(minute / 60); const hour = hour24 % 12 || 12; const label = `${hour}:${String(minute % 60).padStart(2, '0')} ${hour24 >= 12 ? 'PM' : 'AM'}`; if (!overlaps(minute)) result.push(label); }
    return result;
  }
}

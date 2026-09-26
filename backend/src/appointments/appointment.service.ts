import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './appointment.dto';
import { Appointment } from './appointment.entity';
import { UserRole } from '../auth/user.entity';

@Injectable()
export class AppointmentService {
  constructor(@InjectRepository(Appointment) private readonly repo: Repository<Appointment>) {}

  findAll(user: { email: string; role: UserRole }) { return this.repo.find({ where: user.role === UserRole.ADMIN ? {} : { guestEmail: user.email }, order: { createdAt: 'DESC' } }); }

  async create(dto: CreateAppointmentDto, user: { email: string; name: string; role: UserRole }) {
    const stylist = dto.stylist || 'Meera Nair';
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
}

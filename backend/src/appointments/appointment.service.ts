import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './appointment.dto';
import { Appointment } from './appointment.entity';

@Injectable()
export class AppointmentService {
  constructor(@InjectRepository(Appointment) private readonly repo: Repository<Appointment>) {}

  findAll() { return this.repo.find({ order: { createdAt: 'DESC' } }); }

  create(dto: CreateAppointmentDto) {
    return this.repo.save(this.repo.create({ ...dto, guestName: dto.guestName || 'Ananya Rao', stylist: dto.stylist || 'Meera Nair', status: 'Requested' }));
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    appointment.status = dto.status;
    return this.repo.save(appointment);
  }
}

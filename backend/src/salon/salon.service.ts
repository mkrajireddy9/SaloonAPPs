import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSalonDto } from './salon.dto';
import { Salon } from './salon.entity';

const demoSalon = { name: 'Halo Studio', location: 'Indiranagar, Bengaluru', services: ['Signature cut', 'Texture refresh', 'Colour consultation', 'Gloss refresh'], stylists: ['Meera Nair', 'Arjun S.', 'Nidhi Rao'], openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'], serviceDetails: [{ name: 'Signature cut', durationMinutes: 60, price: 1840 }, { name: 'Texture refresh', durationMinutes: 75, price: 2200 }, { name: 'Colour consultation', durationMinutes: 45, price: 1200 }, { name: 'Gloss refresh', durationMinutes: 60, price: 1600 }], stylistSchedules: {}, branches: [{ id: 'main', name: 'Indiranagar', location: 'Indiranagar, Bengaluru', openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'] }] };

@Injectable()
export class SalonService {
  constructor(@InjectRepository(Salon) private readonly repo: Repository<Salon>) {}

  async get() {
    let salon = await this.repo.findOne({ where: {} });
    if (!salon) salon = await this.repo.save(this.repo.create(demoSalon));
    return salon;
  }

  async update(dto: UpdateSalonDto) {
    const salon = await this.get();
    Object.assign(salon, { ...dto, name: dto.name?.trim() || salon.name, location: dto.location?.trim() || salon.location });
    return this.repo.save(salon);
  }
}

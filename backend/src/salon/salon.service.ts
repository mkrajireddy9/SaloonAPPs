import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePriceListDto, UpdateSalonDto, UpdateSalonThemeDto } from './salon.dto';
import { Salon } from './salon.entity';

const demoSalon = { name: 'Halo Studio', location: 'Indiranagar, Bengaluru', services: ['Signature cut', 'Texture refresh', 'Colour consultation', 'Gloss refresh'], stylists: ['Meera Nair', 'Arjun S.', 'Nidhi Rao'], openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'], serviceDetails: [{ name: 'Signature cut', durationMinutes: 60, price: 1840, active: true }, { name: 'Texture refresh', durationMinutes: 75, price: 2200, active: true }, { name: 'Colour consultation', durationMinutes: 45, price: 1200, active: true }, { name: 'Gloss refresh', durationMinutes: 60, price: 1600, active: true }], stylistSchedules: {}, branches: [{ id: 'main', name: 'Indiranagar', location: 'Indiranagar, Bengaluru', openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'] }], theme: { brandName: 'halo', logoMark: 'h', logoUrl: '', primary: '#b9533a', sidebar: '#20352d', surface: '#f7f5f0', ink: '#25372f' } };

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

  async updateTheme(dto: UpdateSalonThemeDto) {
    const salon = await this.get();
    salon.theme = { ...salon.theme, ...dto };
    return this.repo.save(salon);
  }

  async getPriceList() {
    const salon = await this.get();
    return salon.serviceDetails || [];
  }

  async updatePriceList(dto: UpdatePriceListDto) {
    const salon = await this.get();
    const items = dto.items.map(item => ({ ...item, name: item.name.trim(), active: item.active !== false, discountPrice: item.discountPrice || (item.discountPercent ? Math.round(item.price * (1 - item.discountPercent / 100)) : undefined) }));
    salon.serviceDetails = items;
    salon.services = items.map(item => item.name);
    return this.repo.save(salon).then(saved => saved.serviceDetails);
  }
}

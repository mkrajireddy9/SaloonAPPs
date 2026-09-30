import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalonBranchDto, UpdatePriceListDto, UpdateSalonDto, UpdateSalonThemeDto } from './salon.dto';
import { Salon } from './salon.entity';

const demoSalon = { name: 'Halo Studio', location: 'Indiranagar, Bengaluru', services: ['Signature cut', 'Texture refresh', 'Colour consultation', 'Gloss refresh'], stylists: ['Meera Nair', 'Arjun S.', 'Nidhi Rao'], openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'], serviceDetails: [{ name: 'Signature cut', durationMinutes: 60, price: 1840, active: true }, { name: 'Texture refresh', durationMinutes: 75, price: 2200, active: true }, { name: 'Colour consultation', durationMinutes: 45, price: 1200, active: true }, { name: 'Gloss refresh', durationMinutes: 60, price: 1600, active: true }], products: [{ id: 'loreal-professionnel', name: "L'Oreal Professionnel", description: 'Professional colour, care, and styling products.', imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80', active: true }, { id: 'brilare', name: 'Brilare', description: 'Botanical hair and scalp care products.', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80', active: true }, { id: 'schwarzkopf', name: 'Schwarzkopf Professional', description: 'Salon colour and finishing essentials.', imageUrl: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=80', active: true }], stylistSchedules: {}, branches: [{ id: 'main', name: 'Indiranagar', location: 'Indiranagar, Bengaluru', contact: '', active: true, openingHours: { open: '09:00', close: '19:00' }, closedDays: ['Sunday'], services: ['Signature cut', 'Texture refresh', 'Colour consultation', 'Gloss refresh'], stylists: ['Meera Nair', 'Arjun S.', 'Nidhi Rao'] }], theme: { brandName: 'halo', logoMark: 'h', logoUrl: '', primary: '#b9533a', sidebar: '#20352d', surface: '#f7f5f0', ink: '#25372f' } };

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;

function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function validateHours(hours: { open: string; close: string }, label: string) {
  if (!hours || !timePattern.test(hours.open) || !timePattern.test(hours.close) || minutes(hours.open) >= minutes(hours.close)) {
    throw new BadRequestException(`${label} must have valid opening and closing times, with opening before closing`);
  }
}

function validateBranches(branches: SalonBranchDto[], services: string[], stylists: string[]) {
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const branch of branches) {
    const id = branch.id.trim(); const name = branch.name.trim();
    if (ids.has(id) || names.has(name.toLowerCase())) throw new BadRequestException('Branch IDs and names must be unique');
    ids.add(id); names.add(name.toLowerCase());
    if (!id || !name || !branch.location.trim()) throw new BadRequestException('Each branch needs an ID, name, and location');
    validateHours(branch.openingHours, `Branch ${name}`);
    if (branch.closedDays.some(day => !days.includes(day))) throw new BadRequestException(`Branch ${name} has an invalid closed day`);
    if (branch.services?.some(service => !services.includes(service))) throw new BadRequestException(`Branch ${name} contains an unknown service`);
    if (branch.stylists?.some(stylist => !stylists.includes(stylist))) throw new BadRequestException(`Branch ${name} contains an unknown stylist`);
  }
  if (!branches.some(branch => branch.active !== false)) throw new BadRequestException('At least one branch must be active');
}

@Injectable()
export class SalonService {
  constructor(@InjectRepository(Salon) private readonly repo: Repository<Salon>) {}

  async get(salonId?: string) {
    let salon = salonId ? await this.repo.findOne({ where: { id: salonId } }) : await this.repo.findOne({ where: {} });
    if (!salon && process.env.NODE_ENV !== 'production') salon = await this.repo.save(this.repo.create(demoSalon));
    if (salon && process.env.NODE_ENV !== 'production') { const existing = new Set((salon.products || []).map(product => product.id)); const missing = demoSalon.products.filter(product => !existing.has(product.id)); if (missing.length) { salon.products = [...(salon.products || []), ...missing]; salon = await this.repo.save(salon); } }
    if (!salon) throw new ServiceUnavailableException('Salon configuration has not been created');
    return salon;
  }

  async listPublic() {
    const salons = await this.repo.find({ order: { name: 'ASC' } });
    return salons.map(salon => ({ id: salon.id, name: salon.name, location: salon.location, branches: (salon.branches || []).filter(branch => branch.active !== false), services: salon.services, stylists: salon.stylists }));
  }
  async getById(id: string) {
    const salon = await this.repo.findOne({ where: { id } });
    if (!salon) throw new ServiceUnavailableException('Salon is not available');
    return salon;
  }

  async update(dto: UpdateSalonDto, salonId?: string) {
    const salon = await this.get(salonId);
    const name = dto.name?.trim() || salon.name;
    const location = dto.location?.trim() || salon.location;
    const services = dto.services || salon.services;
    const stylists = dto.stylists || salon.stylists;
    if (dto.openingHours) validateHours(dto.openingHours, 'Salon');
    if (dto.closedDays?.some(day => !days.includes(day))) throw new BadRequestException('Salon has an invalid closed day');
    const branches = (dto.branches || salon.branches || []).map(branch => ({ ...branch, id: branch.id.trim(), name: branch.name.trim(), location: branch.location.trim(), contact: branch.contact?.trim() || '', active: branch.active !== false, services: branch.services?.length ? branch.services : services, stylists: branch.stylists?.length ? branch.stylists : stylists }));
    if (!branches.length) throw new BadRequestException('At least one branch is required');
    validateBranches(branches, services, stylists);
    Object.assign(salon, { ...dto, name, location, services, stylists, branches });
    return this.repo.save(salon);
  }

  async updateTheme(dto: UpdateSalonThemeDto, salonId?: string) {
    const salon = await this.get(salonId);
    salon.theme = { ...salon.theme, ...dto };
    return this.repo.save(salon);
  }

  async getPriceList(salonId?: string) {
    const salon = await this.get(salonId);
    return salon.serviceDetails || [];
  }

  async updatePriceList(dto: UpdatePriceListDto, salonId?: string) {
    const salon = await this.get(salonId);
    const items = dto.items.map(item => ({ ...item, name: item.name.trim(), active: item.active !== false, discountPrice: item.discountPrice || (item.discountPercent ? Math.round(item.price * (1 - item.discountPercent / 100)) : undefined) }));
    salon.serviceDetails = items;
    salon.services = items.map(item => item.name);
    return this.repo.save(salon).then(saved => saved.serviceDetails);
  }
}

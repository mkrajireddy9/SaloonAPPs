import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalonBranchDto, UpdatePriceListDto, UpdateSalonDto, UpdateSalonThemeDto } from './salon.dto';
import { Salon } from './salon.entity';

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
    if (!salon) throw new ServiceUnavailableException('Salon configuration has not been created');
    return salon;
  }

  async listPublic(latitude?: number, longitude?: number, radiusKm = 25) {
    const salons = await this.repo.find({ order: { name: 'ASC' } });
    const hasLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
    const distance = (branch: { latitude?: number; longitude?: number }) => { if (!hasLocation || !Number.isFinite(branch.latitude) || !Number.isFinite(branch.longitude)) return null; const radians = (value: number) => value * Math.PI / 180; const dLat = radians(branch.latitude! - latitude!); const dLon = radians(branch.longitude! - longitude!); const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(latitude!)) * Math.cos(radians(branch.latitude!)) * Math.sin(dLon / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); };
    return salons.map(salon => { const branches = (salon.branches || []).filter(branch => branch.active !== false).map(branch => ({ ...branch, distanceKm: distance(branch) })).filter(branch => !hasLocation || branch.distanceKm === null || branch.distanceKm <= radiusKm); return { id: salon.id, name: salon.name, location: salon.location, branches, services: salon.services, stylists: salon.stylists, distanceKm: branches.reduce<number | null>((nearest, branch) => branch.distanceKm === null ? nearest : nearest === null ? branch.distanceKm : Math.min(nearest, branch.distanceKm), null) }; }).filter(salon => salon.branches.length).sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER));
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

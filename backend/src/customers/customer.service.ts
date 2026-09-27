import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { User, UserRole } from '../auth/user.entity';
import { CustomerHistoryQueryDto, UpdateCustomerProfileDto } from './customer.dto';

type RequestUser = { id: string; email: string; role: UserRole };

@Injectable()
export class CustomerService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>, @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>) {}

  private page(query: CustomerHistoryQueryDto) { return { page: Math.max(1, Number(query.page) || 1), pageSize: Math.min(100, Math.max(1, Number(query.pageSize) || 10)) }; }

  private matches(appointment: Appointment, query: CustomerHistoryQueryDto) {
    return (!query.dateFrom || appointment.date >= query.dateFrom) && (!query.dateTo || appointment.date <= query.dateTo) && (!query.service || appointment.service.toLowerCase().includes(query.service.toLowerCase())) && (!query.stylist || appointment.stylist.toLowerCase().includes(query.stylist.toLowerCase())) && (!query.branchId || appointment.branchId === query.branchId) && (!query.status || appointment.status === query.status);
  }

  private async appointmentsFor(user: { id: string; email: string }) {
    const records = await this.appointments.find({ where: [{ customerId: user.id }, { guestEmail: user.email }], order: { date: 'DESC', time: 'DESC' } });
    return [...new Map(records.map(item => [item.id, item])).values()];
  }

  async getProfile(user: RequestUser) {
    const customer = await this.users.findOne({ where: { id: user.id, role: UserRole.USER } });
    if (!customer) throw new NotFoundException('Customer account not found');
    return this.profile(customer);
  }

  async updateProfile(user: RequestUser, dto: UpdateCustomerProfileDto) {
    const customer = await this.users.findOne({ where: { id: user.id, role: UserRole.USER } });
    if (!customer) throw new NotFoundException('Customer account not found');
    const email = dto.email?.trim().toLowerCase();
    if (email && email !== customer.email && await this.users.findOne({ where: { email } })) throw new ConflictException('That email is already in use');
    Object.assign(customer, { ...dto, ...(email ? { email } : {}), name: dto.name?.trim() || customer.name, phone: dto.phone?.trim() || null, location: dto.location?.trim() || null, texture: dto.texture?.trim() || null, length: dto.length?.trim() || null, preferredStylist: dto.preferredStylist?.trim() || null });
    return this.profile(await this.users.save(customer));
  }

  async history(user: RequestUser, query: CustomerHistoryQueryDto) {
    return this.paginatedHistory(await this.appointmentsFor(user), query);
  }

  async customerHistory(id: string, query: CustomerHistoryQueryDto) {
    const customer = await this.users.findOne({ where: { id, role: UserRole.USER } });
    if (!customer) throw new NotFoundException('Customer account not found');
    return this.paginatedHistory(await this.appointmentsFor(customer), query);
  }

  private paginatedHistory(records: Appointment[], query: CustomerHistoryQueryDto) {
    const filtered = records.filter(item => this.matches(item, query));
    const { page, pageSize } = this.page(query);
    return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize, pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)) };
  }

  async list(query: CustomerHistoryQueryDto) {
    const customers = await this.users.find({ where: { role: UserRole.USER }, order: { createdAt: 'DESC' } });
    const search = query.search?.trim().toLowerCase();
    const records = (await Promise.all(customers.map(async customer => {
      const appointments = await this.appointmentsFor(customer);
      const filtered = appointments.filter(item => this.matches(item, query));
      const searchable = [customer.name, customer.email, customer.phone || ''].join(' ').toLowerCase();
      if (search && !searchable.includes(search)) return null;
      if ((query.dateFrom || query.dateTo || query.service || query.stylist || query.branchId || query.status) && !filtered.length) return null;
      return { ...this.profile(customer), appointmentCount: appointments.length, filteredAppointmentCount: filtered.length, lastAppointment: appointments[0] || null };
    }))).filter(Boolean) as Array<Record<string, unknown>>;
    const { page, pageSize } = this.page(query);
    return { items: records.slice((page - 1) * pageSize, page * pageSize), total: records.length, page, pageSize, pageCount: Math.max(1, Math.ceil(records.length / pageSize)) };
  }

  async exportCsv(query: CustomerHistoryQueryDto) {
    const result = await this.list({ ...query, page: 1, pageSize: 100000 });
    const header = ['Name', 'Email', 'Phone', 'Location', 'Visits', 'Last appointment', 'Last service', 'Last status'];
    const rows = result.items.map((item: any) => [item.name, item.email, item.phone || '', item.location || '', item.appointmentCount, item.lastAppointment?.date || '', item.lastAppointment?.service || '', item.lastAppointment?.status || '']);
    return [header, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  private profile(user: User) { return { id: user.id, name: user.name, email: user.email, phone: user.phone || '', location: user.location || '', texture: user.texture || '', length: user.length || '', preferredStylist: user.preferredStylist || '', createdAt: user.createdAt }; }
}

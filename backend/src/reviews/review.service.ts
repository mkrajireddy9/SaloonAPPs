import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto, UpdateReviewStatusDto } from './review.dto';
import { Review } from './review.entity';
import { UserRole } from '../auth/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class ReviewService {
  constructor(@InjectRepository(Review) private readonly repo: Repository<Review>, @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>) {}
  list(user?: { email: string; role: UserRole; salonId?: string }) {
    const salonFilter = user?.salonId ? 'review."salonId" = :salonId' : '1=1';
    if (user?.role === UserRole.ADMIN) return this.repo.createQueryBuilder('review').where(salonFilter, { salonId: user.salonId }).orderBy('review."createdAt"', 'DESC').getMany();
    return this.repo.createQueryBuilder('review').where(salonFilter, { salonId: user?.salonId }).andWhere('(review.status = :published OR review."guestEmail" = :email)', { published: 'Published', email: user?.email || '' }).orderBy('review."createdAt"', 'DESC').getMany();
  }
  async create(dto: CreateReviewDto, user: { email: string; name: string; salonId?: string }) {
    const appointment = dto.appointmentId ? await this.appointments.findOne({ where: { id: dto.appointmentId, guestEmail: user.email } }) : null;
    if (dto.appointmentId && !appointment) throw new NotFoundException('Appointment not found');
    const salonId = appointment?.salonId || user.salonId || null;
    if (dto.appointmentId && await this.repo.findOne({ where: { appointmentId: dto.appointmentId, guestEmail: user.email, salonId: salonId || undefined } })) throw new ConflictException('You already reviewed this appointment');
    return this.repo.save(this.repo.create({ salonId, rating: dto.rating, comment: dto.comment.trim(), guestEmail: user.email, guestName: user.name, appointmentId: dto.appointmentId || null, status: 'Pending' }));
  }
  async updateStatus(id: string, dto: UpdateReviewStatusDto, salonId?: string) { const review = await this.repo.findOne({ where: { id, ...(salonId ? { salonId } : {}) } }); if (!review) throw new NotFoundException('Review not found'); review.status = dto.status; return this.repo.save(review); }
}

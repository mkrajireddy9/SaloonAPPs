import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto, UpdateReviewStatusDto } from './review.dto';
import { Review } from './review.entity';
import { UserRole } from '../auth/user.entity';

@Injectable()
export class ReviewService {
  constructor(@InjectRepository(Review) private readonly repo: Repository<Review>) {}
  list(user?: { email: string; role: UserRole }) {
    if (user?.role === UserRole.ADMIN) return this.repo.find({ order: { createdAt: 'DESC' } });
    return this.repo.createQueryBuilder('review').where('review.status = :published OR review."guestEmail" = :email', { published: 'Published', email: user?.email || '' }).orderBy('review."createdAt"', 'DESC').getMany();
  }
  async create(dto: CreateReviewDto, user: { email: string; name: string }) {
    if (dto.appointmentId && await this.repo.findOne({ where: { appointmentId: dto.appointmentId, guestEmail: user.email } })) throw new ConflictException('You already reviewed this appointment');
    return this.repo.save(this.repo.create({ rating: dto.rating, comment: dto.comment.trim(), guestEmail: user.email, guestName: user.name, appointmentId: dto.appointmentId || null, status: 'Pending' }));
  }
  async updateStatus(id: string, dto: UpdateReviewStatusDto) { const review = await this.repo.findOne({ where: { id } }); if (!review) throw new NotFoundException('Review not found'); review.status = dto.status; return this.repo.save(review); }
}

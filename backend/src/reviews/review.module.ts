import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Review } from './review.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({ imports: [TypeOrmModule.forFeature([Review]), AuthModule], controllers: [ReviewController], providers: [ReviewService] })
export class ReviewModule {}

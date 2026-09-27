import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaAsset } from './media.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from './cloudinary.service';

@Module({ imports: [TypeOrmModule.forFeature([MediaAsset]), AuthModule], controllers: [MediaController], providers: [MediaService, CloudinaryService], exports: [MediaService] })
export class MediaModule {}

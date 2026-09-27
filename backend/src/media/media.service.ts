import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { existsSync, promises as fs } from 'fs';
import { MediaAsset } from './media.entity';

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(@InjectRepository(MediaAsset) private readonly repo: Repository<MediaAsset>) {}

  async onModuleInit() {
    const expired = await this.repo.find({ where: { retentionUntil: LessThan(new Date()) } });
    for (const asset of expired) { await fs.unlink(asset.storagePath).catch(() => undefined); await this.repo.remove(asset); }
  }

  async validateAndSave(file: any, ownerEmail: string, consentGiven = false) {
    if (!file || !allowed.has(file.mimetype)) throw new BadRequestException('Only JPEG, PNG, and WebP images are supported');
    const maxBytes = Number(process.env.MEDIA_MAX_BYTES || 5 * 1024 * 1024);
    if (file.size > maxBytes) throw new BadRequestException(`Images must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller`);
    const bytes = await fs.readFile(file.path);
    const validSignature = (file.mimetype === 'image/jpeg' && bytes.subarray(0, 3).toString('hex') === 'ffd8ff') || (file.mimetype === 'image/png' && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') || (file.mimetype === 'image/webp' && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP');
    if (!validSignature) { await fs.unlink(file.path).catch(() => undefined); throw new BadRequestException('The uploaded file is not a valid image'); }
    const retentionDays = Math.max(1, Number(process.env.MEDIA_RETENTION_DAYS || 365));
    const consentedAt = consentGiven ? new Date() : null;
    const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
    const saved = await this.repo.save(this.repo.create({ ownerEmail, filename: file.filename, originalName: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'), mimeType: file.mimetype, size: file.size, storagePath: file.path, visibility: 'private', consentGiven, consentedAt, retentionUntil }));
    return { id: saved.id, url: `/media/${saved.id}`, mimeType: saved.mimeType, size: saved.size };
  }

  async get(id: string, _ownerEmail: string, _isAdmin: boolean) {
    const asset = await this.repo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('Media asset not found');
    if (!existsSync(asset.storagePath)) throw new NotFoundException('Media file is missing');
    return asset;
  }

  async remove(id: string, ownerEmail: string, isAdmin: boolean) {
    const asset = await this.get(id, ownerEmail, isAdmin);
    if (!isAdmin && asset.ownerEmail !== ownerEmail) throw new ForbiddenException('You cannot delete this image');
    await fs.unlink(asset.storagePath).catch(() => undefined);
    await this.repo.remove(asset);
    return { success: true };
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { existsSync, promises as fs } from 'fs';
import sharp = require('sharp');
import type { Metadata } from 'sharp';

const sharpFactory = sharp as unknown as (input: string, options?: { failOn?: string }) => { metadata(): Promise<Metadata> };
import { MediaAsset } from './media.entity';
import { CloudinaryService } from './cloudinary.service';

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class MediaService implements OnModuleInit {
  constructor(@InjectRepository(MediaAsset) private readonly repo: Repository<MediaAsset>, private readonly cloudinary: CloudinaryService) {}

  async onModuleInit() {
    const expired = await this.repo.find({ where: { retentionUntil: LessThan(new Date()) } });
    for (const asset of expired) { if (asset.storageProvider === 'cloudinary' && asset.publicId) await this.cloudinary.destroy(asset.publicId); else await fs.unlink(asset.storagePath).catch(() => undefined); await this.repo.remove(asset); }
  }

  async validateAndSave(file: any, ownerEmail: string, salonId: string | null, consentGiven = false) {
    if (!file || !allowed.has(file.mimetype)) throw new BadRequestException('Only JPEG, PNG, and WebP images are supported');
    const maxBytes = Number(process.env.MEDIA_MAX_BYTES || 5 * 1024 * 1024);
    if (file.size > maxBytes) throw new BadRequestException(`Images must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller`);
    const bytes = await fs.readFile(file.path);
    const validSignature = (file.mimetype === 'image/jpeg' && bytes.subarray(0, 3).toString('hex') === 'ffd8ff') || (file.mimetype === 'image/png' && bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') || (file.mimetype === 'image/webp' && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP');
    if (!validSignature) { await fs.unlink(file.path).catch(() => undefined); throw new BadRequestException('The uploaded file is not a valid image'); }
    let metadata: Metadata;
    try { metadata = await sharpFactory(file.path, { failOn: 'none' }).metadata(); } catch (error) { await fs.unlink(file.path).catch(() => undefined); const reason = error instanceof Error ? error.message.split('\n')[0] : 'decoder failure'; throw new BadRequestException(`The uploaded JPEG could not be decoded: ${reason}`); }
    const width = metadata.width || 0; const height = metadata.height || 0;
    if (!width || !height || width < 100 || height < 100 || width > 8000 || height > 8000 || width * height > 40_000_000) { await fs.unlink(file.path).catch(() => undefined); throw new BadRequestException('Images must be between 100x100 and 8000x8000 pixels'); }
    const retentionDays = Math.max(1, Number(process.env.MEDIA_RETENTION_DAYS || 365));
    const consentedAt = consentGiven ? new Date() : null;
    const retentionUntil = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
    let storageProvider: 'local' | 'cloudinary' = 'local'; let publicId: string | null = null; let storagePath = file.path;
    if (this.cloudinary.enabled()) { try { const uploaded = await this.cloudinary.upload(file.path, file.mimetype, file.originalname); storageProvider = 'cloudinary'; publicId = uploaded.publicId; storagePath = uploaded.url; await fs.unlink(file.path).catch(() => undefined); } catch { await fs.unlink(file.path).catch(() => undefined); throw new BadRequestException('Image storage provider is unavailable'); } }
    const saved = await this.repo.save(this.repo.create({ salonId, ownerEmail, filename: file.filename, originalName: file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'), mimeType: file.mimetype, size: file.size, width, height, format: metadata.format || null, storagePath, storageProvider, publicId, visibility: 'private', consentGiven, consentedAt, retentionUntil }));
    return { id: saved.id, url: `/media/${saved.id}`, mimeType: saved.mimeType, size: saved.size };
  }

  async get(id: string, _ownerEmail: string, _isAdmin: boolean, salonId: string | null) {
    const asset = await this.repo.findOne({ where: { id, ...(salonId ? { salonId } : {}) } });
    if (!asset) throw new NotFoundException('Media asset not found');
    if (asset.storageProvider === 'local' && !existsSync(asset.storagePath)) throw new NotFoundException('Media file is missing');
    return asset;
  }

  signedUrl(publicId: string, format?: string | null) { return this.cloudinary.signedUrl(publicId, format); }

  async remove(id: string, ownerEmail: string, isAdmin: boolean, salonId: string | null) {
    const asset = await this.get(id, ownerEmail, isAdmin, salonId);
    if (!isAdmin && asset.ownerEmail !== ownerEmail) throw new ForbiddenException('You cannot delete this image');
    if (asset.storageProvider === 'cloudinary' && asset.publicId) await this.cloudinary.destroy(asset.publicId); else await fs.unlink(asset.storagePath).catch(() => undefined);
    await this.repo.remove(asset);
    return { success: true };
  }
}

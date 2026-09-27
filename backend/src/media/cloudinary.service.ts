import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';

type CloudinaryAsset = { publicId: string; url: string; width?: number; height?: number; format?: string };

@Injectable()
export class CloudinaryService {
  enabled() { return process.env.MEDIA_STORAGE === 'cloudinary' && Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET); }
  private signature(value: string) { return createHash('sha1').update(`${value}${process.env.CLOUDINARY_API_SECRET}`).digest('hex'); }
  async upload(path: string, mimeType: string, originalName: string): Promise<CloudinaryAsset> {
    if (!this.enabled()) throw new Error('Cloudinary configuration is missing');
    const timestamp = Math.floor(Date.now() / 1000); const publicId = `halo/${Date.now()}-${originalName.replace(/[^a-zA-Z0-9_-]/g, '_')}`; const signature = this.signature(`public_id=${publicId}&timestamp=${timestamp}`);
    const form = new FormData(); form.append('file', new Blob([await fs.readFile(path)], { type: mimeType }), originalName); form.append('api_key', process.env.CLOUDINARY_API_KEY!); form.append('timestamp', String(timestamp)); form.append('public_id', publicId); form.append('type', 'authenticated'); form.append('signature', signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
    if (!response.ok) throw new Error(`Cloudinary upload failed with ${response.status}`);
    const result = await response.json() as { public_id: string; secure_url: string; width?: number; height?: number; format?: string };
    return { publicId: result.public_id, url: result.secure_url, width: result.width, height: result.height, format: result.format };
  }
  signedUrl(publicId: string) {
    const path = `v1/${publicId}`; return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/authenticated/s--${this.signature(path)}--/${path}`;
  }
  async destroy(publicId: string) {
    if (!this.enabled()) return;
    const timestamp = Math.floor(Date.now() / 1000); const signature = this.signature(`public_id=${publicId}&timestamp=${timestamp}`); const form = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: process.env.CLOUDINARY_API_KEY!, signature });
    await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  }
}

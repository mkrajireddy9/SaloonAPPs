import { Body, Controller, Delete, Get, Param, Post, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../auth/user.entity';
import { MediaService } from './media.service';

const { diskStorage } = require('multer') as { diskStorage: (options: any) => any };

const uploadDirectory = resolve(process.cwd(), 'uploads');
mkdirSync(uploadDirectory, { recursive: true });

@Controller('media') @ApiTags('media') @ApiBearerAuth()
export class MediaController {
  constructor(private readonly service: MediaService, private readonly jwt: JwtService) {}
  @Post('upload') @UseGuards(JwtAuthGuard) @ApiConsumes('multipart/form-data') @UseInterceptors(FileInterceptor('file', { storage: diskStorage({ destination: uploadDirectory, filename: (_req: any, file: any, cb: (error: Error | null, name: string) => void) => cb(null, `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`) }), limits: { fileSize: Number(process.env.MEDIA_MAX_BYTES || 5 * 1024 * 1024) } })) @ApiOperation({ summary: 'Upload and validate a private image asset' }) upload(@UploadedFile() file: any, @Body() body: { consentGiven?: string }, @Req() request: { user: { email: string } }) { return this.service.validateAndSave(file, request.user.email, body.consentGiven === 'true'); }
  @Get(':id') @ApiOperation({ summary: 'Read an authorized private image asset using bearer auth or an image token' }) async get(@Param('id') id: string, @Query('token') token: string | undefined, @Req() request: any, @Res() response: any) { let user = request.user as { email: string; role: UserRole } | undefined; if (!user && token) { try { user = this.jwt.verify(token) as { email: string; role: UserRole }; } catch { return response.status(401).json({ message: 'Invalid image token' }); } } if (!user) return response.status(401).json({ message: 'Bearer token required' }); const asset = await this.service.get(id, user.email, user.role === UserRole.ADMIN); if (asset.storageProvider === 'cloudinary' && asset.publicId) return response.redirect(this.service.signedUrl(asset.publicId, asset.format)); return response.sendFile(asset.storagePath); }
  @Delete(':id') @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Delete an authorized image asset' }) remove(@Param('id') id: string, @Req() request: { user: { email: string; role: UserRole } }) { return this.service.remove(id, request.user.email, request.user.role === UserRole.ADMIN); }
}

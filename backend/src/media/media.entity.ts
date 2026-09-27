import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('media_assets')
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column() ownerEmail!: string;
  @Column() filename!: string;
  @Column() originalName!: string;
  @Column() mimeType!: string;
  @Column({ type: 'int' }) size!: number;
  @Column({ type: 'int', nullable: true }) width!: number | null;
  @Column({ type: 'int', nullable: true }) height!: number | null;
  @Column({ type: 'varchar', nullable: true }) format!: string | null;
  @Column() storagePath!: string;
  @Column({ default: 'private' }) visibility!: 'private';
  @Column({ default: 'local' }) storageProvider!: 'local' | 'cloudinary';
  @Column({ type: 'varchar', nullable: true }) publicId!: string | null;
  @Column({ default: false }) consentGiven!: boolean;
  @Column({ type: 'timestamptz', nullable: true }) consentedAt!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) retentionUntil!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}

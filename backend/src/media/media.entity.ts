import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('media_assets')
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column() ownerEmail!: string;
  @Column() filename!: string;
  @Column() originalName!: string;
  @Column() mimeType!: string;
  @Column({ type: 'int' }) size!: number;
  @Column() storagePath!: string;
  @Column({ default: 'private' }) visibility!: 'private';
  @CreateDateColumn() createdAt!: Date;
}

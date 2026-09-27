import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type NotificationChannel = 'email' | 'sms' | 'whatsapp';
export type NotificationStatus = 'Queued' | 'Sent' | 'Failed';

@Entity('notifications')
@Index(['appointmentId', 'event', 'channel'], { unique: true })
export class Notification {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ type: 'uuid', nullable: true }) appointmentId!: string | null;
  @Index() @Column() recipientEmail!: string;
  @Column() channel!: NotificationChannel;
  @Column() event!: string;
  @Column({ default: 'Queued' }) status!: NotificationStatus;
  @Column({ default: 0 }) attempts!: number;
  @Column({ default: 3 }) maxAttempts!: number;
  @Column({ type: 'varchar', nullable: true }) providerMessageId!: string | null;
  @Column({ type: 'jsonb', default: '{}' }) payload!: Record<string, unknown>;
  @Column({ type: 'text', nullable: true }) lastError!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) scheduledAt!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) sentAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

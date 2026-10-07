import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole { USER = 'user', ADMIN = 'admin' }

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column({ unique: true }) email!: string;
  @Column({ select: false }) passwordHash!: string;
  @Column({ type: 'varchar', nullable: true, select: false }) refreshTokenHash!: string | null;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER }) role!: UserRole;
  @Column({ type: 'uuid', nullable: true }) salonId!: string | null;
  @Column({ type: 'varchar', nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', nullable: true }) location!: string | null;
  @Column({ type: 'varchar', nullable: true }) texture!: string | null;
  @Column({ type: 'varchar', nullable: true }) length!: string | null;
  @Column({ type: 'varchar', nullable: true }) preferredStylist!: string | null;
  @Column({ type: 'jsonb', default: '{"email":true,"appointmentReminders":true}' }) notificationPreferences!: { email: boolean; appointmentReminders: boolean };
  @Column({ default: false }) emailVerified!: boolean;
  @Column({ type: 'varchar', nullable: true, select: false }) passwordResetTokenHash!: string | null;
  @Column({ type: 'timestamptz', nullable: true, select: false }) passwordResetExpiresAt!: Date | null;
  @Column({ type: 'varchar', nullable: true, select: false }) emailVerificationTokenHash!: string | null;
  @Column({ type: 'timestamptz', nullable: true, select: false }) emailVerificationExpiresAt!: Date | null;
  @Column({ default: true }) active!: boolean;
  @Column({ type: 'timestamptz', nullable: true }) lastSeenAt!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) lastLoginAt!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) lastLogoutAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}

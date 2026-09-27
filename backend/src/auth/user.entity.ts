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
  @Column({ type: 'varchar', nullable: true }) phone!: string | null;
  @Column({ type: 'varchar', nullable: true }) location!: string | null;
  @Column({ type: 'varchar', nullable: true }) texture!: string | null;
  @Column({ type: 'varchar', nullable: true }) length!: string | null;
  @Column({ type: 'varchar', nullable: true }) preferredStylist!: string | null;
  @Column({ type: 'jsonb', default: '{"email":true,"sms":false,"whatsapp":false}' }) notificationPreferences!: { email: boolean; sms: boolean; whatsapp: boolean };
  @CreateDateColumn() createdAt!: Date;
}

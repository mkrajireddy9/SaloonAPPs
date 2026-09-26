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
  @CreateDateColumn() createdAt!: Date;
}

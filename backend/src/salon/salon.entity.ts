import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('salons')
export class Salon {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ default: 'Halo Studio' }) name!: string;
  @Column({ default: 'Indiranagar, Bengaluru' }) location!: string;
  @Column({ type: 'jsonb', default: '[]' }) services!: string[];
  @Column({ type: 'jsonb', default: '[]' }) stylists!: string[];
  @Column({ type: 'jsonb', default: '[]' }) serviceDetails!: { name: string; durationMinutes: number; price: number; imageUrl?: string }[];
  @Column({ type: 'jsonb', default: '{}' }) stylistSchedules!: Record<string, { workingDays: string[]; leaveDates: string[] }>;
  @Column({ type: 'jsonb', default: '{}' }) stylistProfiles!: Record<string, { bio: string; imageUrl: string }>;
  @Column({ type: 'jsonb', default: '[]' }) branches!: { id: string; name: string; location: string; openingHours: { open: string; close: string }; closedDays: string[] }[];
  @Column({ type: 'jsonb', default: '{"open":"09:00","close":"19:00"}' }) openingHours!: { open: string; close: string };
  @Column({ type: 'jsonb', default: '[]' }) closedDays!: string[];
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

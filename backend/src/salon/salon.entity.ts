import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('salons')
export class Salon {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', nullable: true }) ownerId!: string | null;
  @Column({ default: 'Halo Studio' }) name!: string;
  @Column({ default: 'Indiranagar, Bengaluru' }) location!: string;
  @Column({ type: 'jsonb', default: '[]' }) services!: string[];
  @Column({ type: 'jsonb', default: '[]' }) stylists!: string[];
  @Column({ type: 'jsonb', default: '[]' }) serviceDetails!: { name: string; durationMinutes: number; price: number; discountPercent?: number; discountPrice?: number; offerText?: string; active?: boolean; imageUrl?: string }[];
  @Column({ type: 'jsonb', default: '[]' }) products!: { id: string; name: string; description?: string; imageUrl?: string; active?: boolean }[];
  @Column({ type: 'jsonb', default: '{}' }) stylistSchedules!: Record<string, { workingDays: string[]; leaveDates: string[] }>;
  @Column({ type: 'jsonb', default: '{}' }) stylistProfiles!: Record<string, { bio: string; imageUrl: string }>;
  @Column({ type: 'jsonb', default: '[]' }) branches!: { id: string; name: string; location: string; contact?: string; active?: boolean; openingHours: { open: string; close: string }; closedDays: string[]; services?: string[]; stylists?: string[] }[];
  @Column({ type: 'jsonb', default: '{"open":"09:00","close":"19:00"}' }) openingHours!: { open: string; close: string };
  @Column({ type: 'jsonb', default: '[]' }) closedDays!: string[];
  @Column({ type: 'jsonb', default: '{"brandName":"halo","logoMark":"h","logoUrl":"","primary":"#b9533a","sidebar":"#20352d","surface":"#f7f5f0","ink":"#25372f"}' }) theme!: { brandName: string; logoMark: string; logoUrl: string; primary: string; sidebar: string; surface: string; ink: string };
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'uuid', nullable: true }) salonId!: string | null;
  @Column() guestName!: string;
  @Column({ default: '' }) phone!: string;
  @Column({ default: 'Meera Nair' }) stylist!: string;
  @Column({ default: 'A cut that feels like me' }) goal!: string;
  @Column({ default: 'Shoulder length' }) length!: string;
  @Column({ default: 'Wavy' }) texture!: string;
  @Column({ default: 'front,left,right' }) capturedViews!: string;
  @Column({ type: 'jsonb', nullable: true }) report!: Record<string, unknown> | null;
  @Column({ type: 'text', nullable: true }) beforeImage!: string | null;
  @Column({ type: 'text', nullable: true }) afterImage!: string | null;
  @Column({ default: '' }) selectedStyle!: string;
  @Column({ type: 'jsonb', default: '[]' }) selectedServices!: string[];
  @Column({ default: 'draft' }) status!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

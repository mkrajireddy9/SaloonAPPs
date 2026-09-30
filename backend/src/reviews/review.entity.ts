import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ type: 'uuid', nullable: true }) salonId!: string | null;
  @Column() guestEmail!: string;
  @Column() guestName!: string;
  @Column({ type: 'varchar', nullable: true }) appointmentId!: string | null;
  @Column({ type: 'int' }) rating!: number;
  @Column({ type: 'text', default: '' }) comment!: string;
  @Column({ default: 'Pending' }) status!: 'Pending' | 'Published' | 'Rejected';
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

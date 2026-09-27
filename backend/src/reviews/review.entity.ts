import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() guestEmail!: string;
  @Column() guestName!: string;
  @Column({ type: 'varchar', nullable: true }) appointmentId!: string | null;
  @Column({ type: 'int' }) rating!: number;
  @Column({ type: 'text', default: '' }) comment!: string;
  @Column({ default: 'Pending' }) status!: 'Pending' | 'Published' | 'Rejected';
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

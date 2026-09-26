import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ default: 'Ananya Rao' }) guestName!: string;
  @Column({ default: '' }) guestEmail!: string;
  @Column() service!: string;
  @Column() date!: string;
  @Column() time!: string;
  @Column({ default: 'Meera Nair' }) stylist!: string;
  @Column({ default: '' }) notes!: string;
  @Column({ default: 'Requested' }) status!: 'Requested' | 'Confirmed' | 'Cancelled';
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

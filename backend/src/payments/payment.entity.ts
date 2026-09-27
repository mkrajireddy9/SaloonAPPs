import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column() appointmentId!: string;
  @Index() @Column() guestEmail!: string;
  @Column({ default: 'local' }) provider!: string;
  @Column({ type: 'varchar', nullable: true }) providerPaymentId!: string | null;
  @Index({ unique: true }) @Column() idempotencyKey!: string;
  @Column({ default: 'INR' }) currency!: string;
  @Column({ type: 'int', default: 0 }) subtotal!: number;
  @Column({ type: 'int', default: 0 }) discount!: number;
  @Column({ type: 'int', default: 0 }) tax!: number;
  @Column({ type: 'int', default: 0 }) total!: number;
  @Column({ default: 'Pending' }) status!: PaymentStatus;
  @Column({ unique: true }) invoiceNumber!: string;
  @Column({ type: 'timestamptz', nullable: true }) paidAt!: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) refundedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

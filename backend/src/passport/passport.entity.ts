import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('passports')
export class Passport {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) ownerEmail!: string;
  @Column({ default: 'Ananya Rao' }) guestName!: string;
  @Column({ default: 'Hyderabad' }) location!: string;
  @Column({ default: 'Wavy' }) texture!: string;
  @Column({ default: 'Shoulder length' }) length!: string;
  @Column({ default: 'Meera Nair' }) preferredStylist!: string;
  @Column({ type: 'jsonb', default: '[]' }) preferences!: string[];
  @Column({ default: '' }) notes!: string;
  @Column({ type: 'jsonb', default: '[]' }) styles!: Record<string, string>[];
  @Column({ type: 'jsonb', default: '[]' }) history!: Record<string, string>[];
  @Column({ default: '/images/hair-before.svg' }) beforeImage!: string;
  @Column({ default: '/images/hair-lob.svg' }) afterImage!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

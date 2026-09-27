import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Index() @Column({ type: 'varchar', nullable: true }) actorEmail!: string | null;
  @Column({ type: 'varchar', nullable: true }) actorRole!: string | null;
  @Column() action!: string;
  @Column() method!: string;
  @Column() path!: string;
  @Column({ type: 'jsonb', default: '{}' }) metadata!: Record<string, unknown>;
  @CreateDateColumn() createdAt!: Date;
}

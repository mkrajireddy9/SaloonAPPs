import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("device_push_tokens")
@Index(["userId", "expoPushToken"], { unique: true })
export class DevicePushToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ type: "uuid" }) userId!: string;
  @Index() @Column({ type: "uuid", nullable: true }) salonId!: string | null;
  @Column({ type: "varchar", unique: true }) expoPushToken!: string;
  @Column({ type: "varchar", default: "unknown" }) deviceType!: string;
  @Column({ default: true }) isActive!: boolean;
  @Column({ type: "varchar", nullable: true }) lastTicketId!: string | null;
  @Column({ type: "text", nullable: true }) lastError!: string | null;
  @Column({ type: "timestamptz", nullable: true }) lastUsedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("user_notifications")
@Index(["recipientUserId", "createdAt"])
@Index(["recipientUserId", "isRead"])
export class UserNotification {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ type: "uuid" }) recipientUserId!: string;
  @Index() @Column({ type: "uuid", nullable: true }) salonId!: string | null;
  @Column() notificationType!: string;
  @Column() title!: string;
  @Column({ type: "text" }) message!: string;
  @Column({ type: "jsonb", default: "{}" }) payload!: Record<string, unknown>;
  @Column({ type: "uuid", nullable: true }) relatedEntityId!: string | null;
  @Column({ default: false }) isRead!: boolean;
  @Column({ type: "timestamptz", nullable: true }) sentAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}

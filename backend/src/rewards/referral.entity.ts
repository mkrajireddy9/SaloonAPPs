import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("referrals")
export class Referral {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index({ unique: true }) @Column() code!: string;
  @Index() @Column() referrerId!: string;
  @Index() @Column({ type: "uuid", nullable: true }) salonId!: string | null;
  @Column({ type: "uuid", nullable: true }) referredId!: string | null;
  @Column({ default: "claimed" }) status!: "claimed" | "completed";
  @Column({ type: "int", default: 100 }) rewardAmount!: number;
  @Column({ type: "timestamptz", nullable: true }) completedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}

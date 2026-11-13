import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("membership_plans")
export class MembershipPlan {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ type: "uuid" }) salonId!: string;
  @Column() name!: string;
  @Column({ type: "int", default: 0 }) price!: number;
  @Column({ type: "int", default: 1 }) sessionCount!: number;
  @Column({ type: "int", default: 30 }) validityDays!: number;
  @Column({ type: "jsonb", default: "[]" }) eligibleServices!: string[];
  @Column({ default: true }) active!: boolean;
  @CreateDateColumn() createdAt!: Date;
}

@Entity("memberships")
export class Membership {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ type: "uuid" }) salonId!: string;
  @Index() @Column({ type: "uuid", nullable: true }) customerId!: string | null;
  @Index() @Column() guestEmail!: string;
  @Column({ type: "uuid" }) planId!: string;
  @Column({ type: "int", default: 0 }) amountPaid!: number;
  @Column({ type: "int" }) totalSessions!: number;
  @Column({ type: "int" }) remainingSessions!: number;
  @Column({ type: "date" }) startsAt!: string;
  @Column({ type: "date" }) expiresAt!: string;
  @Column({ default: "active" }) status!: "active" | "expired" | "exhausted" | "cancelled";
  @CreateDateColumn() createdAt!: Date;
}

@Entity("membership_usages")
export class MembershipUsage {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index() @Column({ type: "uuid" }) membershipId!: string;
  @Index() @Column({ type: "uuid" }) salonId!: string;
  @Column({ type: "uuid", nullable: true }) appointmentId!: string | null;
  @Column() service!: string;
  @Column({ type: "int", default: 1 }) sessionsUsed!: number;
  @Column({ type: "int", default: 0 }) serviceCost!: number;
  @Column() usedByEmail!: string;
  @CreateDateColumn() usedAt!: Date;
}

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("coupons")
@Index(["salonId", "code"], { unique: true })
export class Coupon {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "uuid", nullable: true }) salonId!: string | null;
  @Column() code!: string;
  @Column({ default: "percent" }) discountType!: "percent" | "fixed";
  @Column({ type: "int" }) discountValue!: number;
  @Column({ type: "int", nullable: true }) maxUses!: number | null;
  @Column({ default: 0 }) usedCount!: number;
  @Column({ default: true }) active!: boolean;
  @Column({ type: "timestamptz", nullable: true }) startsAt!: Date | null;
  @Column({ type: "timestamptz", nullable: true }) endsAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}

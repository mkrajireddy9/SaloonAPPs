import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("salon_wishlists")
@Unique("IDX_salon_wishlists_user_salon", ["userId", "salonId"])
export class SalonWishlist {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Index("IDX_salon_wishlists_user")
  @Column({ type: "uuid" }) userId!: string;
  @Index("IDX_salon_wishlists_salon")
  @Column({ type: "uuid" }) salonId!: string;
  @CreateDateColumn() createdAt!: Date;
}

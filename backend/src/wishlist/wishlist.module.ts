import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { SalonModule } from "../salon/salon.module";
import { Salon } from "../salon/salon.entity";
import { WishlistController } from "./wishlist.controller";
import { SalonWishlist } from "./wishlist.entity";
import { WishlistService } from "./wishlist.service";

@Module({
  imports: [AuthModule, SalonModule, TypeOrmModule.forFeature([SalonWishlist, Salon])],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}

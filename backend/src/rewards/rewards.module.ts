import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { User } from "../auth/user.entity";
import { Salon } from "../salon/salon.entity";
import { Coupon } from "./coupon.entity";
import { Referral } from "./referral.entity";
import { RewardsController } from "./rewards.controller";
import { RewardsService } from "./rewards.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User, Salon, Coupon, Referral])],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}

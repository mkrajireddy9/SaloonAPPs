import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/user.entity";
import { AuthModule } from "../auth/auth.module";
import { MembershipController } from "./membership.controller";
import { Membership, MembershipPlan, MembershipUsage } from "./membership.entity";
import { MembershipService } from "./membership.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([MembershipPlan, Membership, MembershipUsage, User]),
  ],
  controllers: [MembershipController],
  providers: [MembershipService],
})
export class MembershipModule {}

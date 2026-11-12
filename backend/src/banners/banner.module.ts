import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { Banner } from "./banner.entity";
import { BannerController } from "./banner.controller";
import { BannerService } from "./banner.service";
import { Salon } from "../salon/salon.entity";
@Module({
  imports: [TypeOrmModule.forFeature([Banner, Salon]), AuthModule],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}

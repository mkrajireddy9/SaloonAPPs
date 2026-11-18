import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/user.entity";
import { ClaimReferralDto, CreateCouponDto, UpdateCouponDto, UpdateReferralSettingsDto, ValidateCouponDto } from "./rewards.dto";
import { RewardsService } from "./rewards.service";

@Controller("rewards") @ApiTags("rewards") @ApiBearerAuth() @UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly service: RewardsService) {}
  @Get() summary(@Req() request: any) { return this.service.summary(request.user, request.query.salonId); }
  @Post("referral/claim") claim(@Body() dto: ClaimReferralDto, @Req() request: any) { return this.service.claimReferral(dto, request.user); }
  @Post("coupons/validate") validate(@Body() dto: ValidateCouponDto) { return this.service.validateCoupon(dto); }
  @Get("coupons/available") available(@Req() request: any) { return this.service.listAvailableCoupons(request.query.salonId); }
  @Post("coupons") @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCouponDto, @Req() request: any) { return this.service.createCoupon(dto, request.user); }
  @Get("coupons/admin") @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  list(@Req() request: any) { return this.service.listCoupons(request.user); }
  @Patch("referral-settings") @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  updateReferralSettings(@Body() dto: UpdateReferralSettingsDto, @Req() request: any) { return this.service.updateReferralSettings(dto, request.user); }
  @Patch("coupons/:id") @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateCouponDto, @Req() request: any) { return this.service.updateCoupon(id, dto, request.user); }
}

import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { UserRole } from "../auth/user.entity";
import { CreateMembershipDto, CreateMembershipPlanDto, UseMembershipDto } from "./membership.dto";
import { MembershipService } from "./membership.service";

@Controller("memberships")
@ApiTags("memberships")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(private readonly service: MembershipService) {}
  @Get("me") me(@Req() req: any) { return this.service.listMine(req.user); }
  @Get("plans") plans(@Query("salonId") salonId: string | undefined, @Req() req: any) { return this.service.listPlans(salonId, req.user); }
  @Get("admin/members") @UseGuards(RolesGuard) @Roles(UserRole.ADMIN) members(@Req() req: any) { return this.service.listSalonMembers(req.user); }
  @Post("plans") @UseGuards(RolesGuard) @Roles(UserRole.ADMIN) createPlan(@Body() dto: CreateMembershipPlanDto, @Req() req: any) { return this.service.createPlan(dto, req.user); }
  @Post() @UseGuards(RolesGuard) @Roles(UserRole.ADMIN) issue(@Body() dto: CreateMembershipDto, @Req() req: any) { return this.service.issue(dto, req.user); }
  @Post(":id/use") @UseGuards(RolesGuard) @Roles(UserRole.ADMIN) use(@Param("id") id: string, @Body() dto: UseMembershipDto, @Req() req: any) { return this.service.use(id, dto, req.user); }
}

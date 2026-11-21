import { Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { UserRole } from "../auth/user.entity";
import { WishlistService } from "./wishlist.service";

@Controller("wishlist")
@ApiTags("wishlist")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "List the current customer's saved salons" })
  list(@Req() request: { user: { id: string; role?: UserRole } }, @Query("latitude") latitude?: string, @Query("longitude") longitude?: string) {
    return this.service.list(request.user, Number(latitude), Number(longitude));
  }

  @Post(":salonId")
  @ApiOperation({ summary: "Save a salon to the current customer's wishlist" })
  add(@Param("salonId") salonId: string, @Req() request: { user: { id: string; role?: UserRole } }) {
    return this.service.add(salonId, request.user);
  }

  @Delete(":salonId")
  @ApiOperation({ summary: "Remove a salon from the current customer's wishlist" })
  remove(@Param("salonId") salonId: string, @Req() request: { user: { id: string; role?: UserRole } }) {
    return this.service.remove(salonId, request.user);
  }
}

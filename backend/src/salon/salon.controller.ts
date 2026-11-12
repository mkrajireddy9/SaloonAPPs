import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "../auth/user.entity";
import {
  UpdatePriceListDto,
  UpdateSalonDto,
  UpdateSalonThemeDto,
  CreatePlatformSalonDto,
  UpdateProductsDto,
} from "./salon.dto";
import { SalonService } from "./salon.service";

@Controller("salon")
@ApiTags("salon")
@ApiBearerAuth()
export class SalonController {
  constructor(private readonly service: SalonService) {}

  @Get("platform/salons")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  listPlatform() {
    return this.service.listPlatform();
  }

  @Post("platform/salons")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  createPlatform(@Body() dto: CreatePlatformSalonDto) {
    return this.service.createPlatform(dto.name, dto.location);
  }

  @Patch("platform/salons/:id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  setPlatformStatus(
    @Param("id") id: string,
    @Body() body: { active: boolean },
  ) {
    return this.service.setPlatformStatus(id, body.active === true);
  }

  @Post("platform/salons/:id/rotate-tenant-code")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  rotateTenantCode(@Param("id") id: string) {
    return this.service.rotatePlatformTenantCode(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get salon profile, services, and stylists" })
  get(@Req() request: { user: { salonId?: string } }) {
    return this.service.get(request.user.salonId);
  }
  @Get("directory")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List salons available for guest booking" })
  directory(
    @Query("latitude") latitude?: string,
    @Query("longitude") longitude?: string,
    @Query("radiusKm") radiusKm?: string,
  ) {
    return this.service.listPublic(
      Number(latitude),
      Number(longitude),
      Number(radiusKm) || 25,
    );
  }
  @Get("theme")
  @ApiOperation({ summary: "Get the active salon theme" })
  getTheme(@Req() request: { user?: { salonId?: string } }) {
    return this.service.get(request.user?.salonId).then((salon) => salon.theme);
  }
  @Get("price-list")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get active salon services, prices, and offers" })
  getPriceList(@Req() request: { user: { salonId?: string } }) {
    return this.service.getPriceList(request.user.salonId);
  }
  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update salon profile, services, and stylists (admin only)",
  })
  update(
    @Body() dto: UpdateSalonDto,
    @Req() request: { user: { salonId?: string } },
  ) {
    return this.service.update(dto, request.user.salonId);
  }
  @Put("products")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update salon products (admin only)" })
  updateProducts(
    @Body() dto: UpdateProductsDto,
    @Req() request: { user: { salonId?: string } },
  ) {
    return this.service.updateProducts(dto.products, request.user.salonId);
  }
  @Put("theme")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Save salon branding and theme (admin only)" })
  updateTheme(
    @Body() dto: UpdateSalonThemeDto,
    @Req() request: { user: { salonId?: string } },
  ) {
    return this.service
      .updateTheme(dto, request.user.salonId)
      .then((salon) => salon.theme);
  }
  @Put("price-list")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Save salon prices and discounts (admin only)" })
  updatePriceList(
    @Body() dto: UpdatePriceListDto,
    @Req() request: { user: { salonId?: string } },
  ) {
    return this.service.updatePriceList(dto, request.user.salonId);
  }
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get a salon selected for guest booking" })
  getById(@Param("id") id: string) {
    return this.service.getById(id);
  }
}

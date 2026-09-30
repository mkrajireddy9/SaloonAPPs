import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { UpdatePriceListDto, UpdateSalonDto, UpdateSalonThemeDto } from './salon.dto';
import { SalonService } from './salon.service';

@Controller('salon')
@ApiTags('salon')
@ApiBearerAuth()
export class SalonController {
  constructor(private readonly service: SalonService) {}

  @Get() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get salon profile, services, and stylists' }) get(@Req() request: { user: { salonId?: string } }) { return this.service.get(request.user.salonId); }
  @Get('directory') @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'List salons available for guest booking' }) directory() { return this.service.listPublic(); }
  @Get('theme') @ApiOperation({ summary: 'Get the active salon theme' }) getTheme(@Req() request: { user?: { salonId?: string } }) { return this.service.get(request.user?.salonId).then(salon => salon.theme); }
  @Get('price-list') @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get active salon services, prices, and offers' }) getPriceList(@Req() request: { user: { salonId?: string } }) { return this.service.getPriceList(request.user.salonId); }
  @Put() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Update salon profile, services, and stylists (admin only)' }) update(@Body() dto: UpdateSalonDto, @Req() request: { user: { salonId?: string } }) { return this.service.update(dto, request.user.salonId); }
  @Put('theme') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Save salon branding and theme (admin only)' }) updateTheme(@Body() dto: UpdateSalonThemeDto, @Req() request: { user: { salonId?: string } }) { return this.service.updateTheme(dto, request.user.salonId).then(salon => salon.theme); }
  @Put('price-list') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Save salon prices and discounts (admin only)' }) updatePriceList(@Body() dto: UpdatePriceListDto, @Req() request: { user: { salonId?: string } }) { return this.service.updatePriceList(dto, request.user.salonId); }
  @Get(':id') @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get a salon selected for guest booking' }) getById(@Param('id') id: string) { return this.service.getById(id); }
}

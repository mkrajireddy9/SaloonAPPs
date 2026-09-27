import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
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
@UseGuards(JwtAuthGuard)
export class SalonController {
  constructor(private readonly service: SalonService) {}

  @Get() @ApiOperation({ summary: 'Get salon profile, services, and stylists' }) get() { return this.service.get(); }
  @Get('theme') @ApiOperation({ summary: 'Get the active salon theme' }) getTheme() { return this.service.get().then(salon => salon.theme); }
  @Get('price-list') @ApiOperation({ summary: 'Get active salon services, prices, and offers' }) getPriceList() { return this.service.getPriceList(); }
  @Put() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Update salon profile, services, and stylists (admin only)' }) update(@Body() dto: UpdateSalonDto) { return this.service.update(dto); }
  @Put('theme') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Save salon branding and theme (admin only)' }) updateTheme(@Body() dto: UpdateSalonThemeDto) { return this.service.updateTheme(dto).then(salon => salon.theme); }
  @Put('price-list') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Save salon prices and discounts (admin only)' }) updatePriceList(@Body() dto: UpdatePriceListDto) { return this.service.updatePriceList(dto); }
}

import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { UpdateSalonDto } from './salon.dto';
import { SalonService } from './salon.service';

@Controller('salon')
@ApiTags('salon')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SalonController {
  constructor(private readonly service: SalonService) {}

  @Get() @ApiOperation({ summary: 'Get salon profile, services, and stylists' }) get() { return this.service.get(); }
  @Put() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Update salon profile, services, and stylists (admin only)' }) update(@Body() dto: UpdateSalonDto) { return this.service.update(dto); }
}

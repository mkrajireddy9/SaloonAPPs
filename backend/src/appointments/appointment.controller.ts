import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './appointment.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user.entity';

@Controller('appointments')
@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}
  @Get() @ApiOperation({ summary: 'List appointment requests' }) findAll() { return this.service.findAll(); }
  @Post() @ApiOperation({ summary: 'Create an appointment request' }) create(@Body() dto: CreateAppointmentDto) { return this.service.create(dto); }
  @Patch(':id/status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Update appointment status (admin only)' }) updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) { return this.service.updateStatus(id, dto); }
}

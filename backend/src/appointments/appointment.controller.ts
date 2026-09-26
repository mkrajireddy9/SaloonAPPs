import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
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
  @Get() @ApiOperation({ summary: 'List own appointments or all appointments for admins' }) findAll(@Req() request: { user: { email: string; role: UserRole } }) { return this.service.findAll(request.user); }
  @Post() @ApiOperation({ summary: 'Create an appointment request' }) create(@Body() dto: CreateAppointmentDto, @Req() request: { user: { email: string; name: string; role: UserRole } }) { return this.service.create(dto, request.user); }
  @Patch(':id/status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Update appointment status (admin only)' }) updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) { return this.service.updateStatus(id, dto); }
}

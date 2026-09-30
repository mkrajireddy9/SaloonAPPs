import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, RescheduleAppointmentDto, UpdateAppointmentStatusDto } from './appointment.dto';
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
  @Get() @ApiOperation({ summary: 'List own appointments or all appointments for admins' }) findAll(@Req() request: { user: { id?: string; salonId?: string; email: string; role: UserRole } }) { return this.service.findAll(request.user); }
  @Get('slots') @ApiOperation({ summary: 'List available booking slots for a branch, date, stylist, and service' }) slots(@Query('date') date: string, @Query('salonId') salonId: string, @Query('branchId') branchId?: string, @Query('stylist') stylist?: string, @Query('service') service?: string) { return this.service.slots(date, stylist, service, branchId, salonId); }
  @Post() @ApiOperation({ summary: 'Create an appointment request' }) create(@Body() dto: CreateAppointmentDto, @Req() request: { user: { id?: string; email: string; name: string; role: UserRole; salonId?: string } }) { return this.service.create(dto, request.user); }
  @Patch(':id/status') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) @ApiOperation({ summary: 'Update appointment status (admin only)' }) updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto, @Req() request: { user: { salonId?: string } }) { return this.service.updateStatus(id, dto, request.user.salonId); }
  @Patch(':id/cancel') @ApiOperation({ summary: 'Cancel an appointment owned by the current user or any appointment as admin' }) cancel(@Param('id') id: string, @Req() request: { user: { id?: string; email: string; role: UserRole; salonId?: string } }) { return this.service.cancel(id, request.user); }
  @Patch(':id/reschedule') @ApiOperation({ summary: 'Reschedule an appointment and return it to requested status' }) reschedule(@Param('id') id: string, @Body() dto: RescheduleAppointmentDto, @Req() request: { user: { id?: string; email: string; role: UserRole; salonId?: string } }) { return this.service.reschedule(id, dto, request.user); }
}

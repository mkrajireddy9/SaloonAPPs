import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './appointment.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('appointments')
@ApiTags('appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}
  @Get() @ApiOperation({ summary: 'List appointment requests' }) findAll() { return this.service.findAll(); }
  @Post() @ApiOperation({ summary: 'Create an appointment request' }) create(@Body() dto: CreateAppointmentDto) { return this.service.create(dto); }
  @Patch(':id/status') @ApiOperation({ summary: 'Update appointment status' }) updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) { return this.service.updateStatus(id, dto); }
}

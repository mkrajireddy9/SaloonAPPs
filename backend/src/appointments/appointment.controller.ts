import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './appointment.dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() dto: CreateAppointmentDto) { return this.service.create(dto); }
  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) { return this.service.updateStatus(id, dto); }
}

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CaptureViewDto, CreateConsultationDto } from './consultation.dto';

@Controller('consultations')
export class ConsultationController {
  constructor(private readonly service: ConsultationService) {}
  @Get() list() { return this.service.list(); }
  @Post() create(@Body() dto: CreateConsultationDto) { return this.service.create(dto); }
  @Get(':id') get(@Param('id') id: string) { return this.service.get(id); }
  @Post(':id/capture') capture(@Param('id') id: string, @Body() dto: CaptureViewDto) { return this.service.capture(id, dto); }
  @Post(':id/analyze') analyze(@Param('id') id: string) { return this.service.analyze(id); }
}

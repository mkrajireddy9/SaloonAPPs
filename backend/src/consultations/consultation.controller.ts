import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CaptureViewDto, CreateConsultationDto } from './consultation.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('consultations')
@ApiTags('consultations')
export class ConsultationController {
  constructor(private readonly service: ConsultationService) {}
  @Get() @ApiOperation({ summary: 'List consultations' }) list() { return this.service.list(); }
  @Post() @ApiOperation({ summary: 'Create a consultation' }) create(@Body() dto: CreateConsultationDto) { return this.service.create(dto); }
  @Get(':id') @ApiOperation({ summary: 'Get a consultation' }) get(@Param('id') id: string) { return this.service.get(id); }
  @Post(':id/capture') @ApiOperation({ summary: 'Capture a scan view' }) capture(@Param('id') id: string, @Body() dto: CaptureViewDto) { return this.service.capture(id, dto); }
  @Post(':id/analyze') @ApiOperation({ summary: 'Generate a consultation report' }) analyze(@Param('id') id: string) { return this.service.analyze(id); }
}

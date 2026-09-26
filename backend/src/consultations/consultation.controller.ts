import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { AnalyzeConsultationDto, CaptureViewDto, CreateConsultationDto, SaveConsultationDto } from './consultation.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../auth/user.entity';

@Controller('consultations')
@ApiTags('consultations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ConsultationController {
  constructor(private readonly service: ConsultationService) {}
  @Get() @ApiOperation({ summary: 'List consultations' }) list() { return this.service.list(); }
  @Post() @ApiOperation({ summary: 'Create a consultation' }) create(@Body() dto: CreateConsultationDto) { return this.service.create(dto); }
  @Get(':id') @ApiOperation({ summary: 'Get a consultation' }) get(@Param('id') id: string) { return this.service.get(id); }
  @Post(':id/capture') @ApiOperation({ summary: 'Capture a scan view' }) capture(@Param('id') id: string, @Body() dto: CaptureViewDto) { return this.service.capture(id, dto); }
  @Post(':id/analyze') @ApiOperation({ summary: 'Generate a consultation report from an optional image' }) analyze(@Param('id') id: string, @Body() dto: AnalyzeConsultationDto) { return this.service.analyze(id, dto.imageBase64); }
  @Post(':id/save') @ApiOperation({ summary: 'Save the consultation result and generated before/after look' }) save(@Param('id') id: string, @Body() dto: SaveConsultationDto) { return this.service.saveResult(id, dto); }
}

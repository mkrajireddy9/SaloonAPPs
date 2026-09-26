import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { AiService } from './ai.service';
import { AnalyzeAiDto, QualityCheckDto, TryOnDto } from './ai.dto';

@Controller('ai')
@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AiController {
  constructor(private readonly service: AiService) {}
  @Post('analyze') @ApiOperation({ summary: 'Analyze visible hair characteristics with Ollama or a safe fallback' }) analyze(@Body() dto: AnalyzeAiDto) { return this.service.analyze(dto); }
  @Post('quality-check') @ApiOperation({ summary: 'Validate image capture readiness and return retake guidance' }) quality(@Body() dto: QualityCheckDto) { return this.service.quality(dto); }
  @Post('try-on') @ApiOperation({ summary: 'Return a try-on provider response for a recommended style' }) tryOn(@Body() dto: TryOnDto) { return this.service.tryOn(dto); }
}

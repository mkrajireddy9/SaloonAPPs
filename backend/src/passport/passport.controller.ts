import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/auth.guard';
import { UpdatePassportDto } from './passport.dto';
import { PassportService } from './passport.service';

@Controller('passport')
@ApiTags('passport')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PassportController {
  constructor(private readonly service: PassportService) {}

  @Get() @ApiOperation({ summary: 'Get the authenticated guest hair passport' }) get(@Req() request: { user: { email: string } }) { return this.service.get(request.user.email); }
  @Put() @ApiOperation({ summary: 'Update the authenticated guest hair passport' }) update(@Req() request: { user: { email: string } }, @Body() dto: UpdatePassportDto) { return this.service.update(request.user.email, dto); }
}

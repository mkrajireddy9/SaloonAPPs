import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Post('register') @ApiOperation({ summary: 'Create a user or invited admin account' }) register(@Body() dto: RegisterDto) { return this.service.register(dto); }
  @Post('login') @ApiOperation({ summary: 'Login and receive a JWT access token' }) login(@Body() dto: LoginDto) { return this.service.login(dto); }
  @Get('me') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get the authenticated user' }) me(@Req() request: { user: unknown }) { return request.user; }
}

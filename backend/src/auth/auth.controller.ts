import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, NotificationPreferencesDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Post('register') @ApiOperation({ summary: 'Create a user or invited admin account' }) register(@Body() dto: RegisterDto) { return this.service.register(dto); }
  @Post('login') @ApiOperation({ summary: 'Login and receive a JWT access token' }) login(@Body() dto: LoginDto) { return this.service.login(dto); }
  @Post('refresh') @ApiOperation({ summary: 'Rotate an access token using a refresh token' }) refresh(@Body() dto: RefreshTokenDto) { return this.service.refresh(dto); }
  @Post('logout') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Revoke the current user refresh token' }) logout(@Req() request: { user: { sub: string } }) { return this.service.logout(request.user.sub); }
  @Get('me') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get the authenticated user' }) me(@Req() request: { user: unknown }) { return request.user; }
  @Get('preferences') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get notification preferences' }) preferences(@Req() request: { user: { email: string } }) { return this.service.getNotificationPreferences(request.user.email); }
  @Put('preferences') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Update notification preferences' }) updatePreferences(@Req() request: { user: { email: string } }, @Body() dto: NotificationPreferencesDto) { return this.service.updateNotificationPreferences(request.user.email, dto); }
}

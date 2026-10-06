import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, GoogleLoginDto, LoginDto, NotificationPreferencesDto, RefreshTokenDto, RegisterDto, ResetPasswordDto, VerifyEmailDto } from './auth.dto';
import { JwtAuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { UserRole } from './user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}
  @Post('register') @ApiOperation({ summary: 'Create a user or invited admin account' }) register(@Body() dto: RegisterDto) { return this.service.register(dto); }
  @Post('login') @ApiOperation({ summary: 'Login and receive a JWT access token' }) login(@Body() dto: LoginDto) { return this.service.login(dto); }
  @Post('google') @ApiOperation({ summary: 'Sign in with Google' }) google(@Body() dto: GoogleLoginDto) { return this.service.googleLogin(dto); }
  @Post('refresh') @ApiOperation({ summary: 'Rotate an access token using a refresh token' }) refresh(@Body() dto: RefreshTokenDto) { return this.service.refresh(dto); }
  @Post('forgot-password') @ApiOperation({ summary: 'Request a password reset email' }) forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: { ip?: string }) { return this.service.forgotPassword(dto, request.ip); }
  @Post('reset-password') @ApiOperation({ summary: 'Reset a password with a one-time token' }) resetPassword(@Body() dto: ResetPasswordDto) { return this.service.resetPassword(dto); }
  @Post('resend-verification') @ApiOperation({ summary: 'Resend an email verification link' }) resendVerification(@Body() dto: ForgotPasswordDto, @Req() request: { ip?: string }) { return this.service.resendVerification(dto, request.ip); }
  @Get('verify-email') @ApiOperation({ summary: 'Verify an email address' }) verifyEmail(@Query() query: VerifyEmailDto) { return this.service.verifyEmail(query.token); }
  @Post('verify-email') @ApiOperation({ summary: 'Verify an email address' }) verifyEmailPost(@Body() dto: VerifyEmailDto) { return this.service.verifyEmail(dto.token); }
  @Post('logout') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Revoke the current user refresh token' }) logout(@Req() request: { user: { sub: string } }) { return this.service.logout(request.user.sub); }
  @Post('heartbeat') @ApiBearerAuth() @UseGuards(JwtAuthGuard) heartbeat(@Req() request: { user: { sub: string } }) { return this.service.heartbeat(request.user.sub); }
  @Patch('users/:id/status') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) setStatus(@Param('id') id: string, @Body() body: { active: boolean }) { return this.service.setActive(id, body.active === true); }
  @Get('me') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get the authenticated user' }) me(@Req() request: { user: unknown }) { return request.user; }
  @Get('preferences') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Get notification preferences' }) preferences(@Req() request: { user: { email: string } }) { return this.service.getNotificationPreferences(request.user.email); }
  @Put('preferences') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @ApiOperation({ summary: 'Update notification preferences' }) updatePreferences(@Req() request: { user: { email: string } }, @Body() dto: NotificationPreferencesDto) { return this.service.updateNotificationPreferences(request.user.email, dto); }
}

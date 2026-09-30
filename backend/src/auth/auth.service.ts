import { ConflictException, Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { ForgotPasswordDto, LoginDto, NotificationPreferencesDto, RefreshTokenDto, RegisterDto, ResetPasswordDto } from './auth.dto';
import { User, UserRole } from './user.entity';
import { Salon } from '../salon/salon.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(@InjectRepository(User) private readonly users: Repository<User>, @InjectRepository(Salon) private readonly salons: Repository<Salon>, private readonly jwt: JwtService) {}

  async onModuleInit() {
    await this.ensureActivityColumns();
    if (process.env.NODE_ENV === 'production') return;
    const demoUsers = [
      { name: 'Meera Nair', email: 'admin@halo.local', role: UserRole.ADMIN, salon: { name: 'Halo Studio Indiranagar', location: 'Indiranagar, Bengaluru', services: ['Signature cut', 'Gloss refresh', 'Colour consultation'], stylists: ['Meera Nair', 'Arjun S.'], prices: [{ name: 'Signature cut', durationMinutes: 60, price: 1800, active: true }, { name: 'Gloss refresh', durationMinutes: 45, price: 1400, active: true }, { name: 'Colour consultation', durationMinutes: 30, price: 800, active: true }], products: [{ id: 'loreal-halo', name: "L'Oreal Professionnel", description: 'Professional colour and care.', imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80', active: true }], branch: { id: 'indiranagar', name: 'Indiranagar', location: 'Indiranagar, Bengaluru' } } },
      { name: 'Arjun Rao', email: 'admin@blossom.local', role: UserRole.ADMIN, salon: { name: 'Blossom Hair Lounge', location: 'Banjara Hills, Hyderabad', services: ['Hair spa', 'Hair cut', 'Bridal styling'], stylists: ['Arjun Rao', 'Nidhi Rao'], prices: [{ name: 'Hair spa', durationMinutes: 60, price: 1200, active: true }, { name: 'Hair cut', durationMinutes: 45, price: 700, active: true }, { name: 'Bridal styling', durationMinutes: 120, price: 3500, active: true }], products: [{ id: 'brilare-blossom', name: 'Brilare', description: 'Botanical hair and scalp care.', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80', active: true }], branch: { id: 'banjara-hills', name: 'Banjara Hills', location: 'Banjara Hills, Hyderabad' } } },
      { name: 'Ananya Rao', email: 'guest@halo.local', role: UserRole.USER },
    ];
    for (const demo of demoUsers) {
      let user = await this.users.findOne({ where: { email: demo.email } });
      if (!user) {
        user = await this.users.save(this.users.create({ name: demo.name, email: demo.email, role: demo.role, passwordHash: await bcrypt.hash('password123', 12), refreshTokenHash: null, emailVerified: true, salonId: null }));
      }
      if (demo.role === UserRole.ADMIN && demo.salon && !user.salonId) {
        const branch = { ...demo.salon.branch, contact: '', active: true, openingHours: { open: '09:00', close: '19:00' }, closedDays: [], services: demo.salon.services, stylists: demo.salon.stylists };
        const salon = await this.salons.save(this.salons.create({ name: demo.salon.name, location: demo.salon.location, ownerId: user.id, services: demo.salon.services, stylists: demo.salon.stylists, serviceDetails: demo.salon.prices, products: demo.salon.products, stylistSchedules: {}, stylistProfiles: {}, branches: [branch], openingHours: { open: '09:00', close: '19:00' }, closedDays: [] }));
        user.salonId = salon.id;
        await this.users.save(user);
      }
    }
  }

  private async ensureActivityColumns() {
    await this.users.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`);
    await this.users.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP WITH TIME ZONE`);
    await this.users.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE`);
    await this.users.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLogoutAt" TIMESTAMP WITH TIME ZONE`);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('An account with this email already exists');
    const role = dto.role || UserRole.USER;
    if (role === UserRole.ADMIN && (!process.env.ADMIN_INVITE_CODE || dto.inviteCode !== process.env.ADMIN_INVITE_CODE)) throw new UnauthorizedException('A valid admin invite code is required');
    const user = await this.users.save(this.users.create({ name: dto.name.trim(), email, passwordHash: await bcrypt.hash(dto.password, 12), role, salonId: null, refreshTokenHash: null, emailVerified: false }));
    if (role === UserRole.ADMIN) {
      const salon = await this.salons.save(this.salons.create({ name: `${dto.name.trim()}'s Salon`, location: 'Add your salon location', ownerId: user.id, services: [], stylists: [], products: [], serviceDetails: [], stylistSchedules: {}, stylistProfiles: {}, branches: [], openingHours: { open: '09:00', close: '19:00' }, closedDays: [] }));
      user.salonId = salon.id;
      await this.users.save(user);
    }
    await this.issueEmailVerification(user);
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    if (!dto.email?.trim() && !dto.password && process.env.NODE_ENV !== 'production' && process.env.ALLOW_EMPTY_LOGIN === 'true') {
      const demoEmail = dto.role === UserRole.ADMIN ? 'admin@halo.local' : 'guest@halo.local';
      const demoUser = await this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email: demoEmail }).getOne();
      if (demoUser) return this.issueToken(demoUser);
    }
    const user = await this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email: dto.email?.toLowerCase().trim() || '' }).getOne();
    if (!user || !dto.password || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    if (!user.active) throw new UnauthorizedException('This account has been deactivated');
    if (process.env.NODE_ENV === 'production' && !user.emailVerified) throw new UnauthorizedException('Please verify your email before signing in');
    return this.issueToken(user);
  }

  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
  private limited(key: string, max = 5) {
    const now = Date.now(); const windowMs = 15 * 60 * 1000;
    const bucket = (this.rateLimits.get(key) && now - this.rateLimits.get(key)!.startedAt < windowMs) ? this.rateLimits.get(key)! : { startedAt: now, count: 0 };
    bucket.count += 1; this.rateLimits.set(key, bucket); return bucket.count <= max;
  }
  private rateLimits = new Map<string, { startedAt: number; count: number }>();
  private async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html }) });
    if (!response.ok) {
      const providerBody = await response.text();
      this.logger.error(`Resend rejected email: status=${response.status} body=${providerBody.slice(0, 300)}`);
      throw new Error(`Email provider returned ${response.status}`);
    }
    return true;
  }
  private async issueEmailVerification(user: User) {
    const token = randomBytes(32).toString('hex'); user.emailVerificationTokenHash = this.hashToken(token); user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); await this.users.save(user);
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) { try { await this.sendEmail(user.email, 'Verify your Halo Salon email', `<p>Verify your email to activate your account.</p><p><a href="${url}">Verify email</a></p>`); } catch { this.logger.warn(`Verification email could not be sent to ${user.email}`); /* account creation remains successful; verification can be resent */ } }
  }
  async forgotPassword(dto: ForgotPasswordDto, ip = 'unknown') {
    const email = dto.email.toLowerCase().trim(); if (!this.limited(`reset:${ip}:${email}`)) return { message: 'If an account exists, reset instructions have been sent.' };
    const user = await this.users.createQueryBuilder('user').addSelect(['user.passwordResetTokenHash', 'user.passwordResetExpiresAt']).where('lower(user.email) = lower(:email)', { email }).getOne();
    if (user) { const token = randomBytes(32).toString('hex'); user.passwordResetTokenHash = this.hashToken(token); user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); await this.users.save(user); const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`; if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) { try { await this.sendEmail(user.email, 'Reset your Halo Salon password', `<p>Reset your password within 30 minutes.</p><p><a href="${url}">Reset password</a></p>`); } catch { /* generic response prevents account enumeration */ } } }
    return { message: 'If an account exists, reset instructions have been sent.' };
  }
  async resetPassword(dto: ResetPasswordDto) {
    const hash = this.hashToken(dto.token); const user = await this.users.createQueryBuilder('user').addSelect(['user.passwordResetTokenHash', 'user.passwordResetExpiresAt']).where('user.passwordResetTokenHash = :hash', { hash }).getOne();
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) throw new UnauthorizedException('Invalid or expired reset token');
    user.passwordHash = await bcrypt.hash(dto.password, 12); user.passwordResetTokenHash = null; user.passwordResetExpiresAt = null; await this.users.save(user); return { message: 'Password reset successfully' };
  }
  async resendVerification(dto: ForgotPasswordDto, ip = 'unknown') {
    const email = dto.email.toLowerCase().trim(); if (this.limited(`verify:${ip}:${email}`)) { const user = await this.users.findOne({ where: { email } }); if (user && !user.emailVerified) await this.issueEmailVerification(user); }
    return { message: 'If the account requires verification, a verification email has been sent.' };
  }
  async verifyEmail(token: string) {
    const hash = this.hashToken(token); const user = await this.users.createQueryBuilder('user').addSelect(['user.emailVerificationTokenHash', 'user.emailVerificationExpiresAt']).where('user.emailVerificationTokenHash = :hash', { hash }).getOne();
    if (!user || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) throw new UnauthorizedException('Invalid or expired verification token');
    user.emailVerified = true; user.emailVerificationTokenHash = null; user.emailVerificationExpiresAt = null; await this.users.save(user); return { message: 'Email verified successfully' };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub?: string; type?: string };
    try { payload = this.jwt.verify(dto.refreshToken); } catch { throw new UnauthorizedException('Invalid or expired refresh token'); }
    if (payload.type !== 'refresh' || !payload.sub) throw new UnauthorizedException('Invalid refresh token');
    const user = await this.users.createQueryBuilder('user').addSelect('user.refreshTokenHash').where('user.id = :id', { id: payload.sub }).getOne();
    if (!user?.refreshTokenHash || !(await bcrypt.compare(dto.refreshToken, user.refreshTokenHash))) throw new UnauthorizedException('Refresh token has been revoked');
    return this.issueToken(user);
  }

  async logout(userId: string) { await this.users.update(userId, { refreshTokenHash: null, lastLogoutAt: new Date() }); return { success: true }; }

  async heartbeat(userId: string) { await this.users.update(userId, { lastSeenAt: new Date() }); return { success: true }; }

  async setActive(id: string, active: boolean) { const user = await this.users.findOne({ where: { id, role: UserRole.USER } }); if (!user) throw new UnauthorizedException('User not found'); user.active = active; return this.users.save(user); }

  async getNotificationPreferences(email: string) {
    const user = await this.users.findOne({ where: { email } });
    return user?.notificationPreferences || { email: true, sms: false, whatsapp: false };
  }

  async updateNotificationPreferences(email: string, dto: NotificationPreferencesDto) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');
    user.notificationPreferences = { ...{ email: true, sms: false, whatsapp: false }, ...dto };
    await this.users.save(user);
    return user.notificationPreferences;
  }

  issueToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name, salonId: user.salonId, type: 'access' };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign({ sub: user.id, type: 'refresh' }, { expiresIn: '30d' });
    void this.users.update(user.id, { refreshTokenHash: bcrypt.hashSync(refreshToken, 12), lastLoginAt: new Date(), lastSeenAt: new Date() });
    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}

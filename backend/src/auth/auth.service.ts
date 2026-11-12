import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { Repository } from "typeorm";
import {
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  NotificationPreferencesDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from "./auth.dto";
import { AdminApprovalStatus, User, UserRole } from "./user.entity";
import { Salon } from "../salon/salon.entity";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Salon) private readonly salons: Repository<Salon>,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit() {
    await this.ensureActivityColumns();
    await this.ensurePlatformAdmin();
  }

  private async ensurePlatformAdmin() {
    const email = process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.PLATFORM_ADMIN_PASSWORD;
    if (!email || !password) return;
    const existing = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email })
      .getOne();
    if (existing) {
      if (existing.role !== UserRole.PLATFORM_ADMIN)
        throw new Error("PLATFORM_ADMIN_EMAIL belongs to a non-platform account");
      return;
    }
    await this.users.save(
      this.users.create({
        name: "Platform Administrator",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        role: UserRole.PLATFORM_ADMIN,
        adminApprovalStatus: AdminApprovalStatus.APPROVED,
        salonId: null,
        refreshTokenHash: null,
        emailVerified: true,
        active: true,
      }),
    );
  }

  private async ensureActivityColumns() {
    await this.users.query(
      `ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "tenantCode" varchar`,
    );
    await this.users.query(
      `UPDATE "salons" SET "tenantCode" = 'salon-' || replace(left("id"::text, 8), '-', '') WHERE "tenantCode" IS NULL`,
    );
    await this.users.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_salons_tenantCode" ON "salons" ("tenantCode")`,
    );
    await this.users.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    await this.users.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP WITH TIME ZONE`,
    );
    await this.users.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE`,
    );
    await this.users.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLogoutAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (!this.limited(`register:${email}`, 5))
      throw new UnauthorizedException("Too many registration attempts. Try again later.");
    if (await this.users.findOne({ where: { email } }))
      throw new ConflictException("An account with this email already exists");
    const role = dto.role || UserRole.USER;
    if (role === UserRole.ADMIN && !dto.tenantCode?.trim())
      throw new UnauthorizedException(
        "A salon tenant code is required for admin registration",
      );
    if (
      role === UserRole.ADMIN &&
      (!process.env.ADMIN_INVITE_CODE ||
        process.env.ADMIN_INVITE_CODE.includes("replace-with") ||
        process.env.ADMIN_INVITE_CODE.length < 16 ||
        dto.inviteCode !== process.env.ADMIN_INVITE_CODE)
    )
      throw new UnauthorizedException("A valid admin invite code is required");
    const approval =
      role === UserRole.ADMIN
        ? AdminApprovalStatus.PENDING
        : AdminApprovalStatus.NOT_REQUIRED;
    let tenantSalon: Salon | null = null;
    if (role === UserRole.ADMIN) {
      const tenantCode = dto.tenantCode!.trim().toLowerCase();
      tenantSalon = await this.salons.findOne({
        where: { tenantCode },
      });
      if (!tenantSalon || tenantSalon.active === false)
        throw new UnauthorizedException("Invalid or inactive salon tenant code");
      if (tenantSalon.ownerId)
        throw new ConflictException("This salon already has an assigned admin");
    }
    const user = await this.users.save(
      this.users.create({
        name: dto.name.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        role,
        adminApprovalStatus: approval,
        salonId: null,
        refreshTokenHash: null,
        emailVerified: false,
      }),
    );
    if (role === UserRole.ADMIN) {
      const salon = tenantSalon!;
      user.salonId = salon.id;
      salon.ownerId = user.id;
      await this.salons.save(salon);
      await this.users.save(user);
    }
    await this.issueEmailVerification(user);
    if (role === UserRole.ADMIN)
      return {
        pendingApproval: true,
        message:
          "Your admin registration is awaiting approval from an existing administrator.",
      };
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    if (!this.limited(`login:${email}`, 10))
      throw new UnauthorizedException("Too many login attempts. Try again later.");
    if (
      (dto.role === UserRole.ADMIN || dto.role === UserRole.PLATFORM_ADMIN) &&
      process.env.NODE_ENV !== "production" &&
      process.env.PLATFORM_ADMIN_TEST_LOGIN === "true" &&
      email === process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase().trim() &&
      dto.password === process.env.PLATFORM_ADMIN_PASSWORD
    )
      return this.issueToken(this.platformAdminUser(), false, true);
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email })
      .getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException("Invalid email or password");
    if (
      dto.role &&
      !(
        dto.role === UserRole.ADMIN &&
        user.role === UserRole.PLATFORM_ADMIN
      ) &&
      dto.role !== user.role
    )
      throw new UnauthorizedException(
        "This account is registered for a different workspace",
      );
    if (!user.active)
      throw new UnauthorizedException("This account has been deactivated");
    if (
      user.role === UserRole.ADMIN &&
      user.adminApprovalStatus !== AdminApprovalStatus.APPROVED
    )
      throw new UnauthorizedException(
        user.adminApprovalStatus === AdminApprovalStatus.REJECTED
          ? "Your admin registration was rejected."
          : "Your admin registration is awaiting approval.",
      );
    if (user.role === UserRole.ADMIN) {
      const salon = await this.assertTenant(user.salonId, dto.tenantCode);
      if (!salon.active)
        throw new UnauthorizedException("This salon tenant is inactive");
    }
    if (process.env.NODE_ENV === "production" && !user.emailVerified)
      throw new UnauthorizedException(
        "Please verify your email before signing in",
      );
    return this.issueToken(user);
  }

  async validateAccessSession(payload: {
    sub?: string;
    role?: UserRole;
    salonId?: string | null;
    platformAdmin?: boolean;
  }) {
    if (payload.sub === "platform-admin") {
      if (process.env.NODE_ENV === "production" || payload.platformAdmin !== true)
        throw new UnauthorizedException("Platform session is invalid");
      return;
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.active)
      throw new UnauthorizedException("This account has been deactivated");
    if (user.role !== payload.role || user.salonId !== (payload.salonId || null))
      throw new UnauthorizedException("This session is no longer valid");
    if (user.role === UserRole.ADMIN) {
      if (!user.salonId)
        throw new UnauthorizedException("This admin has no assigned salon");
      const salon = await this.salons.findOne({ where: { id: user.salonId } });
      if (!salon?.active)
        throw new UnauthorizedException("This salon tenant is inactive");
    }
  }

  async googleLogin(dto: GoogleLoginDto) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId)
      throw new UnauthorizedException("Google sign-in is not configured yet");
    let payload: {
      aud?: string;
      iss?: string;
      exp?: number | string;
      email?: string;
      email_verified?: boolean | string;
      name?: string;
    };
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(dto.credential)}`,
      );
      if (!response.ok) throw new Error("Google token rejected");
      payload = (await response.json()) as typeof payload;
    } catch {
      throw new UnauthorizedException(
        "Google sign-in could not be verified. Please try again.",
      );
    }
    const expiresAt = Number(payload.exp);
    if (
      payload.aud !== clientId ||
      !["accounts.google.com", "https://accounts.google.com"].includes(
        payload.iss || "",
      ) ||
      !payload.email ||
      !["true", true].includes(payload.email_verified as string | boolean) ||
      !Number.isFinite(expiresAt) ||
      expiresAt * 1000 <= Date.now()
    )
      throw new UnauthorizedException(
        "Google sign-in could not be verified. Please try again.",
      );
    const email = payload.email.toLowerCase().trim();
    const adminEmails = (process.env.ADMIN_GOOGLE_EMAILS || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const requestedAdmin = dto.role === UserRole.ADMIN;
    if (requestedAdmin && !adminEmails.includes(email))
      throw new UnauthorizedException(
        "This Google email is not approved for admin access.",
      );
    if (requestedAdmin && !dto.tenantCode?.trim())
      throw new UnauthorizedException(
        "A salon tenant code is required for admin registration",
      );
    const tenantSalon = requestedAdmin
      ? await this.salons.findOne({
          where: { tenantCode: dto.tenantCode!.trim().toLowerCase() },
        })
      : null;
    if (requestedAdmin && (!tenantSalon || tenantSalon.active === false))
      throw new UnauthorizedException("Invalid or inactive salon tenant code");
    let user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email })
      .getOne();
    if (
      requestedAdmin &&
      tenantSalon!.ownerId &&
      tenantSalon!.ownerId !== user?.id
    )
      throw new ConflictException("This salon already has an assigned admin");
    if (
      user &&
      dto.role &&
      user.role !== dto.role &&
      !(
        dto.role === UserRole.ADMIN &&
        adminEmails.includes(email) &&
        user.role === UserRole.USER
      )
    )
      throw new UnauthorizedException(
        `This Google account is registered as ${user.role === UserRole.ADMIN ? "admin" : "guest"}. Select the matching workspace.`,
      );
    if (!user) {
      const role = requestedAdmin ? UserRole.ADMIN : UserRole.USER;
      user = await this.users.save(
        this.users.create({
          name: payload.name?.trim() || email.split("@")[0],
          email,
          passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
          role,
          adminApprovalStatus: requestedAdmin
            ? AdminApprovalStatus.PENDING
            : AdminApprovalStatus.NOT_REQUIRED,
          salonId: requestedAdmin ? tenantSalon!.id : null,
          refreshTokenHash: null,
          emailVerified: true,
        }),
      );
      if (requestedAdmin) {
        tenantSalon!.ownerId = user.id;
        await this.salons.save(tenantSalon!);
        user = await this.users.save(user);
      }
    }
    if (
      user &&
      requestedAdmin &&
      user.role === UserRole.USER
    ) {
      user.role = UserRole.ADMIN;
      user.adminApprovalStatus = AdminApprovalStatus.PENDING;
      user.salonId = tenantSalon!.id;
      tenantSalon!.ownerId = user.id;
      await this.salons.save(tenantSalon!);
      user = await this.users.save(user);
    }
    if (!user.active)
      throw new UnauthorizedException("This account has been deactivated");
    if (user.role === UserRole.ADMIN) {
      if (user.adminApprovalStatus !== AdminApprovalStatus.APPROVED)
        return {
          pendingApproval: true,
          message:
            "Your admin registration is awaiting approval from an existing administrator.",
        };
      const salon = await this.assertTenant(user.salonId, dto.tenantCode);
      if (!salon.active)
        throw new UnauthorizedException("This salon tenant is inactive");
    }
    return this.issueToken(user);
  }

  private tenantCode(name: string) {
    return `${
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24) || "salon"
    }-${randomBytes(3).toString("hex")}`;
  }
  private async assertTenant(salonId: string | null, tenantCode?: string) {
    if (!tenantCode?.trim())
      throw new UnauthorizedException("Enter your salon tenant code");
    const salon = await this.salons.findOne({
      where: { tenantCode: tenantCode.trim().toLowerCase() },
    });
    if (!salon || salon.id !== salonId)
      throw new UnauthorizedException("Invalid salon tenant code");
    return salon;
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
  private limited(key: string, max = 5) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const bucket =
      this.rateLimits.get(key) &&
      now - this.rateLimits.get(key)!.startedAt < windowMs
        ? this.rateLimits.get(key)!
        : { startedAt: now, count: 0 };
    bucket.count += 1;
    this.rateLimits.set(key, bucket);
    return bucket.count <= max;
  }
  private rateLimits = new Map<string, { startedAt: number; count: number }>();
  private async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      const providerBody = await response.text();
      this.logger.error(
        `Resend rejected email: status=${response.status} body=${providerBody.slice(0, 300)}`,
      );
      throw new Error(`Email provider returned ${response.status}`);
    }
    return true;
  }
  private async issueEmailVerification(user: User) {
    const token = randomBytes(32).toString("hex");
    user.emailVerificationTokenHash = this.hashToken(token);
    user.emailVerificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    );
    await this.users.save(user);
    const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      try {
        await this.sendEmail(
          user.email,
          "Verify your Halo Salon email",
          `<p>Verify your email to activate your account.</p><p><a href="${url}">Verify email</a></p>`,
        );
      } catch {
        this.logger.warn(
          `Verification email could not be sent to ${user.email}`,
        ); /* account creation remains successful; verification can be resent */
      }
    }
  }
  async forgotPassword(dto: ForgotPasswordDto, ip = "unknown") {
    const email = dto.email.toLowerCase().trim();
    if (!this.limited(`reset:${ip}:${email}`))
      return {
        message: "If an account exists, reset instructions have been sent.",
      };
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect(["user.passwordResetTokenHash", "user.passwordResetExpiresAt"])
      .where("lower(user.email) = lower(:email)", { email })
      .getOne();
    if (user) {
      const token = randomBytes(32).toString("hex");
      user.passwordResetTokenHash = this.hashToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await this.users.save(user);
      const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
      if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
        try {
          await this.sendEmail(
            user.email,
            "Reset your Halo Salon password",
            `<p>Reset your password within 30 minutes.</p><p><a href="${url}">Reset password</a></p>`,
          );
        } catch {
          /* generic response prevents account enumeration */
        }
      }
    }
    return {
      message: "If an account exists, reset instructions have been sent.",
    };
  }
  async resetPassword(dto: ResetPasswordDto) {
    const hash = this.hashToken(dto.token);
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect(["user.passwordResetTokenHash", "user.passwordResetExpiresAt"])
      .where("user.passwordResetTokenHash = :hash", { hash })
      .getOne();
    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    )
      throw new UnauthorizedException("Invalid or expired reset token");
    user.passwordHash = await bcrypt.hash(dto.password, 12);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    await this.users.save(user);
    return { message: "Password reset successfully" };
  }
  async resendVerification(dto: ForgotPasswordDto, ip = "unknown") {
    const email = dto.email.toLowerCase().trim();
    if (this.limited(`verify:${ip}:${email}`)) {
      const user = await this.users.findOne({ where: { email } });
      if (user && !user.emailVerified) await this.issueEmailVerification(user);
    }
    return {
      message:
        "If the account requires verification, a verification email has been sent.",
    };
  }
  async verifyEmail(token: string) {
    const hash = this.hashToken(token);
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect([
        "user.emailVerificationTokenHash",
        "user.emailVerificationExpiresAt",
      ])
      .where("user.emailVerificationTokenHash = :hash", { hash })
      .getOne();
    if (
      !user ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    )
      throw new UnauthorizedException("Invalid or expired verification token");
    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await this.users.save(user);
    return { message: "Email verified successfully" };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: {
      sub?: string;
      role?: UserRole;
      type?: string;
      platformAdmin?: boolean;
    };
    try {
      payload = this.jwt.verify(dto.refreshToken);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    if (payload.type !== "refresh" || !payload.sub)
      throw new UnauthorizedException("Invalid refresh token");
    if (
      payload.platformAdmin === true &&
      process.env.PLATFORM_ADMIN_TEST_LOGIN === "true"
    )
      return this.issueToken(this.platformAdminUser(), false, true);
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.refreshTokenHash")
      .where("user.id = :id", { id: payload.sub })
      .getOne();
    if (
      !user?.refreshTokenHash ||
      !(await bcrypt.compare(dto.refreshToken, user.refreshTokenHash))
    )
      throw new UnauthorizedException("Refresh token has been revoked");
    return this.issueToken(user);
  }

  async logout(userId: string) {
    if (userId === "platform-admin") return { success: true };
    await this.users.update(userId, {
      refreshTokenHash: null,
      lastLogoutAt: new Date(),
    });
    return { success: true };
  }

  async heartbeat(userId: string) {
    if (userId === "platform-admin") return { success: true };
    await this.users.update(userId, { lastSeenAt: new Date() });
    return { success: true };
  }

  async setActive(id: string, active: boolean, salonId?: string) {
    const user = await this.users.findOne({
      where: { id, role: UserRole.USER, ...(salonId ? { salonId } : {}) },
    });
    if (!user) throw new UnauthorizedException("User not found");
    user.active = active;
    return this.users.save(user);
  }

  async listAdminRequests() {
    const users = await this.users.find({
      where: [
        {
          role: UserRole.ADMIN,
          adminApprovalStatus: AdminApprovalStatus.PENDING,
        },
        {
          role: UserRole.ADMIN,
          adminApprovalStatus: AdminApprovalStatus.REJECTED,
        },
      ],
      select: [
        "id",
        "name",
        "email",
        "adminApprovalStatus",
        "salonId",
        "createdAt",
      ],
      order: { createdAt: "DESC" },
    });
    return Promise.all(
      users.map(async (user) => {
        const salon = user.salonId
          ? await this.salons.findOne({ where: { id: user.salonId } })
          : null;
        return {
          ...user,
          salon: salon
            ? { id: salon.id, name: salon.name, tenantCode: salon.tenantCode }
            : null,
        };
      }),
    );
  }

  async approveAdmin(id: string, approved: boolean) {
    const user = await this.users.findOne({
      where: { id, role: UserRole.ADMIN },
    });
    if (!user) throw new UnauthorizedException("Admin registration not found");
    user.adminApprovalStatus = approved
      ? AdminApprovalStatus.APPROVED
      : AdminApprovalStatus.REJECTED;
    user.active = approved;
    return this.users.save(user);
  }

  async getNotificationPreferences(email: string) {
    const user = await this.users.findOne({ where: { email } });
    return (
      user?.notificationPreferences || {
        email: true,
        appointmentReminders: true,
      }
    );
  }

  async updateNotificationPreferences(
    email: string,
    dto: NotificationPreferencesDto,
  ) {
    const user = await this.users.findOne({ where: { email } });
    if (
      !user &&
      email.toLowerCase().trim() ===
        process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase().trim()
    )
      return { email: true, appointmentReminders: true, ...dto };
    if (!user) throw new UnauthorizedException("User not found");
    user.notificationPreferences = {
      ...{ email: true, appointmentReminders: true },
      ...dto,
    };
    await this.users.save(user);
    return user.notificationPreferences;
  }

  private platformAdminUser() {
    return {
      id: "platform-admin",
      name: "Platform Administrator",
      email: process.env.PLATFORM_ADMIN_EMAIL || "platform-admin@halo.local",
      role: UserRole.PLATFORM_ADMIN,
      salonId: null,
      active: true,
      adminApprovalStatus: AdminApprovalStatus.APPROVED,
    } as User;
  }

  issueToken(user: User, persist = true, platformAdmin = false) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      salonId: user.salonId,
      platformAdmin,
      type: "access",
    };
    const accessToken = this.jwt.sign(payload, { expiresIn: "15m" });
    const refreshToken = this.jwt.sign(
      { sub: user.id, role: user.role, platformAdmin, type: "refresh" },
      { expiresIn: "30d" },
    );
    if (persist)
      void this.users.update(user.id, {
        refreshTokenHash: bcrypt.hashSync(refreshToken, 12),
        lastLoginAt: new Date(),
        lastSeenAt: new Date(),
      });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        platformAdmin,
      },
    };
  }
}

import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(@InjectRepository(User) private readonly users: Repository<User>, private readonly jwt: JwtService) {}

  async onModuleInit() {
    const demoUsers = [
      { name: 'Meera Nair', email: 'admin@halo.local', role: UserRole.ADMIN },
      { name: 'Ananya Rao', email: 'guest@halo.local', role: UserRole.USER },
    ];
    for (const demo of demoUsers) {
      if (!await this.users.findOne({ where: { email: demo.email } })) {
        await this.users.save(this.users.create({ ...demo, passwordHash: await bcrypt.hash('password123', 12), refreshTokenHash: null }));
      }
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('An account with this email already exists');
    const role = dto.role || UserRole.USER;
    if (role === UserRole.ADMIN && (!process.env.ADMIN_INVITE_CODE || dto.inviteCode !== process.env.ADMIN_INVITE_CODE)) throw new UnauthorizedException('A valid admin invite code is required');
    const user = await this.users.save(this.users.create({ name: dto.name.trim(), email, passwordHash: await bcrypt.hash(dto.password, 12), role, refreshTokenHash: null }));
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email: dto.email.toLowerCase().trim() }).getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    return this.issueToken(user);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: { sub?: string; type?: string };
    try { payload = this.jwt.verify(dto.refreshToken); } catch { throw new UnauthorizedException('Invalid or expired refresh token'); }
    if (payload.type !== 'refresh' || !payload.sub) throw new UnauthorizedException('Invalid refresh token');
    const user = await this.users.createQueryBuilder('user').addSelect('user.refreshTokenHash').where('user.id = :id', { id: payload.sub }).getOne();
    if (!user?.refreshTokenHash || !(await bcrypt.compare(dto.refreshToken, user.refreshTokenHash))) throw new UnauthorizedException('Refresh token has been revoked');
    return this.issueToken(user);
  }

  async logout(userId: string) { await this.users.update(userId, { refreshTokenHash: null }); return { success: true }; }

  issueToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name, type: 'access' };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign({ sub: user.id, type: 'refresh' }, { expiresIn: '30d' });
    void this.users.update(user.id, { refreshTokenHash: bcrypt.hashSync(refreshToken, 12) });
    return { accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}

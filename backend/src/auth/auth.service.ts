import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { LoginDto, RegisterDto } from './auth.dto';
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
        await this.users.save(this.users.create({ ...demo, passwordHash: await bcrypt.hash('password123', 12) }));
      }
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('An account with this email already exists');
    const role = dto.role || UserRole.USER;
    if (role === UserRole.ADMIN && (!process.env.ADMIN_INVITE_CODE || dto.inviteCode !== process.env.ADMIN_INVITE_CODE)) throw new UnauthorizedException('A valid admin invite code is required');
    const user = await this.users.save(this.users.create({ name: dto.name.trim(), email, passwordHash: await bcrypt.hash(dto.password, 12), role }));
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.createQueryBuilder('user').addSelect('user.passwordHash').where('user.email = :email', { email: dto.email.toLowerCase().trim() }).getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password');
    return this.issueToken(user);
  }

  issueToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return { accessToken: this.jwt.sign(payload), user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
}

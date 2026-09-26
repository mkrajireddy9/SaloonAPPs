import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string }; user?: unknown }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Bearer token required');
    try { const payload = this.jwt.verify(header.slice(7)); if (payload.type !== 'access') throw new UnauthorizedException('Access token required'); request.user = payload; return true; } catch (error) { if (error instanceof UnauthorizedException) throw error; throw new UnauthorizedException('Invalid or expired token'); }
  }
}

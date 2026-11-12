import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "./user.entity";
import { Salon } from "../salon/salon.entity";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Salon) private readonly salons: Repository<Salon>,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string }; user?: unknown }>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer "))
      throw new UnauthorizedException("Bearer token required");
    try {
      const payload = this.jwt.verify(header.slice(7));
      if (payload.type !== "access")
        throw new UnauthorizedException("Access token required");
      if (payload.sub === "platform-admin") {
        if (process.env.NODE_ENV === "production" || payload.platformAdmin !== true)
          throw new UnauthorizedException("Platform session is invalid");
      } else {
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
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

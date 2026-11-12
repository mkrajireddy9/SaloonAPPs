import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "./user.entity";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
    const role = request.user?.role;
    // Platform administration is deliberately not an implicit salon-admin
    // permission. Endpoints that span tenants must opt in explicitly with
    // Roles(UserRole.PLATFORM_ADMIN).
    const allowed = Boolean(role && roles.includes(role));
    if (!allowed)
      throw new ForbiddenException("Insufficient permissions");
    return true;
  }
}

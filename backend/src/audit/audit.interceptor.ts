import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<any>();
    const method = String(request.method || '');
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || request.path === '/auth/refresh') return next.handle();
    return next.handle().pipe(tap(() => void this.audit.record({ actorEmail: request.user?.email || null, actorRole: request.user?.role || null, action: `${method} ${request.path}`, method, path: request.path, metadata: { statusCode: context.switchToHttp().getResponse().statusCode } }).catch(() => undefined)));
  }
}

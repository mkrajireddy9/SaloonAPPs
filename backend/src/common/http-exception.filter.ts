import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<any>(); const request = host.switchToHttp().getRequest<any>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : { message: 'Internal server error' };
    const message = typeof body === 'string' ? body : (body as any).message || 'Request failed';
    if (status >= 500) process.stderr.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', requestId: request.requestId, method: request.method, route: request.originalUrl, statusCode: status, message: 'request failed' })}\n`);
    response.status(status).json({ statusCode: status, message, requestId: request.requestId });
  }
}

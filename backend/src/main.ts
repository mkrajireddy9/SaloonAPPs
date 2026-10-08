import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { randomUUID } from 'crypto';
import { HttpExceptionFilter } from './common/http-exception.filter';

const json = require('express').json;

const requestBuckets = new Map<string, { startedAt: number; count: number }>();

function requestObservabilityMiddleware(request: any, response: any, next: () => void) {
  const started = process.hrtime.bigint(); const requestId = String(request.headers['x-request-id'] || randomUUID()); request.requestId = requestId; response.setHeader('X-Request-Id', requestId);
  response.on('finish', () => { const responseTimeMs = Number(process.hrtime.bigint() - started) / 1_000_000; process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level: response.statusCode >= 500 ? 'error' : response.statusCode >= 400 ? 'warn' : 'info', requestId, method: request.method, route: request.originalUrl, statusCode: response.statusCode, responseTimeMs: Math.round(responseTimeMs * 100) / 100, message: 'request completed' })}\n`); });
  next();
}

function requestSecurityMiddleware(request: any, response: any, next: () => void) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const maxRequests = Number(process.env.RATE_LIMIT_MAX || 120);
  const clientKey = String(request.headers['x-forwarded-for'] || request.ip || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const bucket = requestBuckets.get(clientKey);
  const current = !bucket || now - bucket.startedAt >= windowMs
    ? { startedAt: now, count: 0 }
    : bucket;
  current.count += 1;
  requestBuckets.set(clientKey, current);

  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('RateLimit-Limit', String(maxRequests));
  response.setHeader('RateLimit-Remaining', String(Math.max(0, maxRequests - current.count)));

  if (current.count > maxRequests) {
    response.setHeader('Retry-After', String(Math.ceil((current.startedAt + windowMs - now) / 1000)));
    return response.status(429).json({ message: 'Too many requests. Please try again shortly.' });
  }
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestObservabilityMiddleware);
  app.use(requestSecurityMiddleware);
  app.use(json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  const swaggerConfig = new DocumentBuilder().setTitle('Halo Salon API').setDescription('Consultations, appointments, and salon workspace APIs.').setVersion('1.0').addTag('consultations').addTag('appointments').build();
  SwaggerModule.setup('docs', app as any, SwaggerModule.createDocument(app as any, swaggerConfig));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

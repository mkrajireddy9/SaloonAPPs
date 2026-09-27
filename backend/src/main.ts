import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const json = require('express').json;

const requestBuckets = new Map<string, { startedAt: number; count: number }>();

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
  app.use(requestSecurityMiddleware);
  app.use(json({ limit: process.env.JSON_BODY_LIMIT || '10mb' }));
  const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const swaggerConfig = new DocumentBuilder().setTitle('Halo Salon API').setDescription('Consultations, appointments, and salon workspace APIs.').setVersion('1.0').addTag('consultations').addTag('appointments').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

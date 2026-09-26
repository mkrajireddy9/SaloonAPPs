import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const json = require('express').json;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '10mb' }));
  app.enableCors({ origin: ['http://localhost:5173'], credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const swaggerConfig = new DocumentBuilder().setTitle('Halo Salon API').setDescription('Consultations, appointments, and salon workspace APIs.').setVersion('1.0').addTag('consultations').addTag('appointments').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

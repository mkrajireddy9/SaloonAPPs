import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { Salon } from '../salon/salon.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Salon]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: (() => { const secret = config.get<string>('JWT_SECRET'); if (config.get<string>('NODE_ENV') === 'production' && (!secret || secret.length < 32 || secret.includes('replace-with'))) throw new Error('JWT_SECRET must be a random value of at least 32 characters in production'); return secret || 'local-development-only-change-me'; })(),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '7d') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}

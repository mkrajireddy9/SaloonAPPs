import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { User } from './user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || (config.get<string>('NODE_ENV') === 'production' ? (() => { throw new Error('JWT_SECRET must be configured in production'); })() : 'local-development-only-change-me'),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '7d') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultations/consultation.entity';
import { ConsultationModule } from './consultations/consultation.module';
import { Appointment } from './appointments/appointment.entity';
import { AppointmentModule } from './appointments/appointment.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { Salon } from './salon/salon.entity';
import { SalonModule } from './salon/salon.module';
import { Passport } from './passport/passport.entity';
import { PassportModule } from './passport/passport.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InitialSchema1710000000000 } from './database/migrations/1710000000000-InitialSchema';
import { ConsultationImages1720000000000 } from './database/migrations/1720000000000-ConsultationImages';
import { SalonHours1730000000000 } from './database/migrations/1730000000000-SalonHours';
import { BookingCatalog1740000000000 } from './database/migrations/1740000000000-BookingCatalog';
import { SeedServiceCatalog1750000000000 } from './database/migrations/1750000000000-SeedServiceCatalog';
import { AiModule } from './ai/ai.module';
import { Review } from './reviews/review.entity';
import { ReviewModule } from './reviews/review.module';
import { Reviews1760000000000 } from './database/migrations/1760000000000-Reviews';
import { SalonBranches1770000000000 } from './database/migrations/1770000000000-SalonBranches';
import { StylistProfiles1780000000000 } from './database/migrations/1780000000000-StylistProfiles';
import { NotificationPreferences1790000000000 } from './database/migrations/1790000000000-NotificationPreferences';
import { SalonTheme1800000000000 } from './database/migrations/1800000000000-SalonTheme';
import { FlorenceHairSalonPriceList1810000000000 } from './database/migrations/1810000000000-FlorenceHairSalonPriceList';
import { AppointmentBranches1820000000000 } from './database/migrations/1820000000000-AppointmentBranches';
import { Payment } from './payments/payment.entity';
import { PaymentModule } from './payments/payment.module';
import { Notification } from './notifications/notification.entity';
import { NotificationModule } from './notifications/notification.module';
import { PaymentsNotifications1830000000000 } from './database/migrations/1830000000000-PaymentsNotifications';
import { MediaAsset } from './media/media.entity';
import { MediaModule } from './media/media.module';
import { MediaAssets1840000000000 } from './database/migrations/1840000000000-MediaAssets';
import { resolve } from 'path';
import { CustomerModule } from './customers/customer.module';
import { CustomerProfiles1850000000000 } from './database/migrations/1850000000000-CustomerProfiles';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')] }), TypeOrmModule.forRoot({ type: 'postgres', url: process.env.DATABASE_URL, entities: [Consultation, Appointment, User, Salon, Passport, Review, Payment, Notification, MediaAsset], migrations: [InitialSchema1710000000000, ConsultationImages1720000000000, SalonHours1730000000000, BookingCatalog1740000000000, SeedServiceCatalog1750000000000, Reviews1760000000000, SalonBranches1770000000000, StylistProfiles1780000000000, NotificationPreferences1790000000000, SalonTheme1800000000000, FlorenceHairSalonPriceList1810000000000, AppointmentBranches1820000000000, PaymentsNotifications1830000000000, MediaAssets1840000000000, CustomerProfiles1850000000000], migrationsRun: true, synchronize: false }), ConsultationModule, AppointmentModule, AuthModule, SalonModule, PassportModule, DashboardModule, AiModule, ReviewModule, PaymentModule, NotificationModule, MediaModule, CustomerModule, HealthModule],
})
export class AppModule {}

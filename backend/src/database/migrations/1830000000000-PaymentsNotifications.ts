import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentsNotifications1830000000000 implements MigrationInterface {
  name = 'PaymentsNotifications1830000000000';
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "appointmentId" uuid NOT NULL, "guestEmail" varchar NOT NULL, provider varchar NOT NULL DEFAULT 'local', "providerPaymentId" varchar NULL, "idempotencyKey" varchar NOT NULL UNIQUE, currency varchar NOT NULL DEFAULT 'INR', subtotal integer NOT NULL DEFAULT 0, discount integer NOT NULL DEFAULT 0, tax integer NOT NULL DEFAULT 0, total integer NOT NULL DEFAULT 0, status varchar NOT NULL DEFAULT 'Pending', "invoiceNumber" varchar NOT NULL UNIQUE, "paidAt" timestamptz NULL, "refundedAt" timestamptz NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS payments_appointment_idx ON payments ("appointmentId")');
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "appointmentId" uuid NULL, "recipientEmail" varchar NOT NULL, channel varchar NOT NULL, event varchar NOT NULL, status varchar NOT NULL DEFAULT 'Queued', attempts integer NOT NULL DEFAULT 0, "maxAttempts" integer NOT NULL DEFAULT 3, "providerMessageId" varchar NULL, payload jsonb NOT NULL DEFAULT '{}', "lastError" text NULL, "scheduledAt" timestamptz NULL, "sentAt" timestamptz NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`);
    await queryRunner.query('CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications ("recipientEmail")');
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP TABLE IF EXISTS notifications');
    await queryRunner.query('DROP TABLE IF EXISTS payments');
  }
}

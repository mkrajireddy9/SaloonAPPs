import { MigrationInterface, QueryRunner } from "typeorm";

export class MobilePushNotifications2160000000000 implements MigrationInterface {
  name = "MobilePushNotifications2160000000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "device_push_tokens" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL,
      "salonId" uuid NULL,
      "expoPushToken" varchar NOT NULL UNIQUE,
      "deviceType" varchar NOT NULL DEFAULT 'unknown',
      "isActive" boolean NOT NULL DEFAULT true,
      "lastTicketId" varchar NULL,
      "lastError" text NULL,
      "lastUsedAt" timestamptz NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_device_push_tokens_user" ON "device_push_tokens" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_device_push_tokens_salon" ON "device_push_tokens" ("salonId")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "user_notifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "recipientUserId" uuid NOT NULL,
      "salonId" uuid NULL,
      "notificationType" varchar NOT NULL,
      "title" varchar NOT NULL,
      "message" text NOT NULL,
      "payload" jsonb NOT NULL DEFAULT '{}',
      "relatedEntityId" uuid NULL,
      "isRead" boolean NOT NULL DEFAULT false,
      "sentAt" timestamptz NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_notifications_recipient_created" ON "user_notifications" ("recipientUserId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_notifications_recipient_read" ON "user_notifications" ("recipientUserId", "isRead")`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_push_tokens"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationPreferences1790000000000 implements MigrationInterface {
  name = 'NotificationPreferences1790000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "notificationPreferences" jsonb NOT NULL DEFAULT '{"email":true,"appointmentReminders":true}'`); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS "notificationPreferences"'); }
}

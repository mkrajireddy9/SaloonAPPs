import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationIdempotency1890000000000 implements MigrationInterface {
  name = 'NotificationIdempotency1890000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query('CREATE UNIQUE INDEX IF NOT EXISTS notifications_appointment_event_channel_uidx ON notifications ("appointmentId", event, channel)'); await queryRunner.query('ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS width integer NULL'); await queryRunner.query('ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS height integer NULL'); await queryRunner.query('ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS format varchar NULL'); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS format'); await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS height'); await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS width'); await queryRunner.query('DROP INDEX IF EXISTS notifications_appointment_event_channel_uidx'); }
}

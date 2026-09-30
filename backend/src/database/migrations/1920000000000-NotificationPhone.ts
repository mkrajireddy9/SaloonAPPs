import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationPhone1920000000000 implements MigrationInterface {
  name = 'NotificationPhone1920000000000';
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "guestPhone" varchar NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "recipientPhone" varchar NULL`);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE notifications DROP COLUMN IF EXISTS "recipientPhone"`);
    await queryRunner.query(`ALTER TABLE appointments DROP COLUMN IF EXISTS "guestPhone"`);
  }
}

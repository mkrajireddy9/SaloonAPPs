import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingCatalog1740000000000 implements MigrationInterface {
  name = 'BookingCatalog1740000000000';
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE salons ADD COLUMN IF NOT EXISTS "serviceDetails" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE salons ADD COLUMN IF NOT EXISTS "stylistSchedules" jsonb NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "durationMinutes" integer NOT NULL DEFAULT 60`);
    await queryRunner.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`UPDATE salons SET "serviceDetails" = '[{"name":"Signature cut","durationMinutes":60,"price":1840},{"name":"Texture refresh","durationMinutes":75,"price":2200},{"name":"Colour consultation","durationMinutes":45,"price":1200},{"name":"Gloss refresh","durationMinutes":60,"price":1600}]'::jsonb WHERE "serviceDetails" = '[]'::jsonb`);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE appointments DROP COLUMN IF EXISTS price');
    await queryRunner.query('ALTER TABLE appointments DROP COLUMN IF EXISTS "durationMinutes"');
    await queryRunner.query('ALTER TABLE salons DROP COLUMN IF EXISTS "stylistSchedules"');
    await queryRunner.query('ALTER TABLE salons DROP COLUMN IF EXISTS "serviceDetails"');
  }
}

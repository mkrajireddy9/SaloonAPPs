import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalonHours1730000000000 implements MigrationInterface {
  name = 'SalonHours1730000000000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE salons ADD COLUMN IF NOT EXISTS "openingHours" jsonb NOT NULL DEFAULT '{"open":"09:00","close":"19:00"}'`);
    await queryRunner.query(`ALTER TABLE salons ADD COLUMN IF NOT EXISTS "closedDays" jsonb NOT NULL DEFAULT '["Sunday"]'`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE salons DROP COLUMN IF EXISTS "closedDays"');
    await queryRunner.query('ALTER TABLE salons DROP COLUMN IF EXISTS "openingHours"');
  }
}

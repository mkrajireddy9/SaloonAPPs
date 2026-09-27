import { MigrationInterface, QueryRunner } from 'typeorm';

export class StylistProfiles1780000000000 implements MigrationInterface {
  name = 'StylistProfiles1780000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`ALTER TABLE salons ADD COLUMN IF NOT EXISTS "stylistProfiles" jsonb NOT NULL DEFAULT '{}'`); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('ALTER TABLE salons DROP COLUMN IF EXISTS "stylistProfiles"'); }
}

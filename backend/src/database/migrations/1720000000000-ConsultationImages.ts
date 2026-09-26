import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsultationImages1720000000000 implements MigrationInterface {
  name = 'ConsultationImages1720000000000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "beforeImage" text NULL');
    await queryRunner.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "afterImage" text NULL');
    await queryRunner.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "selectedStyle" varchar NOT NULL DEFAULT \'\'');
    await queryRunner.query('ALTER TABLE consultations ADD COLUMN IF NOT EXISTS "selectedServices" jsonb NOT NULL DEFAULT \'[]\'');
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE consultations DROP COLUMN IF EXISTS "selectedServices"');
    await queryRunner.query('ALTER TABLE consultations DROP COLUMN IF EXISTS "selectedStyle"');
    await queryRunner.query('ALTER TABLE consultations DROP COLUMN IF EXISTS "afterImage"');
    await queryRunner.query('ALTER TABLE consultations DROP COLUMN IF EXISTS "beforeImage"');
  }
}

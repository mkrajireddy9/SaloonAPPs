import { MigrationInterface, QueryRunner } from 'typeorm';

export class CloudMedia1900000000000 implements MigrationInterface {
  name = 'CloudMedia1900000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS "storageProvider" varchar NOT NULL DEFAULT 'local'`); await queryRunner.query('ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS "publicId" varchar NULL'); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS "publicId"'); await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS "storageProvider"'); }
}

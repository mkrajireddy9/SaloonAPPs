import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaAssets1840000000000 implements MigrationInterface {
  name = 'MediaAssets1840000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`CREATE TABLE IF NOT EXISTS media_assets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "ownerEmail" varchar NOT NULL, filename varchar NOT NULL, "originalName" varchar NOT NULL, "mimeType" varchar NOT NULL, size integer NOT NULL, "storagePath" varchar NOT NULL, visibility varchar NOT NULL DEFAULT 'private', "createdAt" timestamptz NOT NULL DEFAULT now())`); await queryRunner.query('CREATE INDEX IF NOT EXISTS media_assets_owner_idx ON media_assets ("ownerEmail")'); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('DROP TABLE IF EXISTS media_assets'); }
}

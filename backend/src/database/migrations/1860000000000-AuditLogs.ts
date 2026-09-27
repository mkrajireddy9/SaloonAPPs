import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLogs1860000000000 implements MigrationInterface {
  name = 'AuditLogs1860000000000';
  async up(queryRunner: QueryRunner) {
    await queryRunner.query('CREATE TABLE IF NOT EXISTS audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "actorEmail" varchar NULL, "actorRole" varchar NULL, action varchar NOT NULL, method varchar NOT NULL, path varchar NOT NULL, metadata jsonb NOT NULL DEFAULT \'{}\', "createdAt" timestamptz NOT NULL DEFAULT now())');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS audit_logs_actor_email_idx ON audit_logs ("actorEmail")');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs ("createdAt")');
    await queryRunner.query('ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS "consentGiven" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS "consentedAt" timestamptz NULL');
    await queryRunner.query('ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS "retentionUntil" timestamptz NULL');
  }
  async down(queryRunner: QueryRunner) { await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS "retentionUntil"'); await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS "consentedAt"'); await queryRunner.query('ALTER TABLE media_assets DROP COLUMN IF EXISTS "consentGiven"'); await queryRunner.query('DROP TABLE IF EXISTS audit_logs'); }
}

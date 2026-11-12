import { MigrationInterface, QueryRunner } from "typeorm";

export class AiHairstyle2050000000000 implements MigrationInterface {
  name = "AiHairstyle2050000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ai_style_sessions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ownerEmail" character varying NOT NULL,
      "photoAssetId" uuid NOT NULL,
      "consentGiven" boolean NOT NULL DEFAULT false,
      "status" character varying NOT NULL DEFAULT 'uploaded',
      "profile" jsonb,
      "preferences" jsonb NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ai_style_sessions" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_style_sessions_ownerEmail" ON "ai_style_sessions" ("ownerEmail")`,
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ai_style_recommendations" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "sessionId" uuid NOT NULL,
      "styleId" character varying NOT NULL,
      "name" character varying NOT NULL,
      "description" text NOT NULL,
      "reason" text NOT NULL,
      "maintenance" character varying NOT NULL DEFAULT 'medium',
      "serviceCategory" character varying NOT NULL DEFAULT 'Haircut',
      "rank" integer NOT NULL,
      "matchReasons" jsonb NOT NULL DEFAULT '[]',
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ai_style_recommendations" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_style_recommendations_sessionId" ON "ai_style_recommendations" ("sessionId")`,
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ai_generation_jobs" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ownerEmail" character varying NOT NULL,
      "sessionId" uuid NOT NULL,
      "recommendationId" uuid NOT NULL,
      "idempotencyKey" character varying NOT NULL,
      "status" character varying NOT NULL DEFAULT 'queued',
      "provider" character varying,
      "model" character varying,
      "outputAssetId" uuid,
      "errorMessage" text,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ai_generation_jobs" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ai_generation_jobs_idempotencyKey" ON "ai_generation_jobs" ("idempotencyKey")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_generation_jobs_ownerEmail" ON "ai_generation_jobs" ("ownerEmail")`,
    );
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ai_usage_logs" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ownerEmail" character varying NOT NULL,
      "sessionId" uuid,
      "action" character varying NOT NULL,
      "provider" character varying,
      "model" character varying,
      "success" boolean NOT NULL DEFAULT false,
      "errorMessage" text,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ai_usage_logs" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ai_usage_logs_ownerEmail" ON "ai_usage_logs" ("ownerEmail")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_usage_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_generation_jobs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_style_recommendations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_style_sessions"`);
  }
}

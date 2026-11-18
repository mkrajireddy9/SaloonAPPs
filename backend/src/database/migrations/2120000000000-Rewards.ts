import { MigrationInterface, QueryRunner } from "typeorm";

export class Rewards2120000000000 implements MigrationInterface {
  name = "Rewards2120000000000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCredits" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "coupons" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "salonId" uuid NULL,
      "code" varchar NOT NULL,
      "salonId" uuid NOT NULL,
      "discountType" varchar NOT NULL DEFAULT 'percent',
      "discountValue" integer NOT NULL,
      "maxUses" integer NULL,
      "usedCount" integer NOT NULL DEFAULT 0,
      "active" boolean NOT NULL DEFAULT true,
      "startsAt" timestamptz NULL,
      "endsAt" timestamptz NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_coupons" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_coupons_salon_code" ON "coupons" ("salonId", "code")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "referrals" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "code" varchar NOT NULL,
      "referrerId" uuid NOT NULL,
      "referredId" uuid NULL,
      "status" varchar NOT NULL DEFAULT 'claimed',
      "rewardAmount" integer NOT NULL DEFAULT 100,
      "completedAt" timestamptz NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_referrals" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_referrals_code" ON "referrals" ("code")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_referrals_referrer" ON "referrals" ("referrerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_referrals_salon" ON "referrals" ("salonId")`);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "referrals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coupons"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "referralCredits"`);
  }
}

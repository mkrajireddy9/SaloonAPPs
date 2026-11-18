import { MigrationInterface, QueryRunner } from "typeorm";

export class SalonReferralReward2140000000000 implements MigrationInterface {
  name = "SalonReferralReward2140000000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "referralRewardAmount" integer NOT NULL DEFAULT 100`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "salons" DROP COLUMN IF EXISTS "referralRewardAmount"`);
  }
}

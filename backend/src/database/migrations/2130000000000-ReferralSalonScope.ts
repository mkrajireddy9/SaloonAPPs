import { MigrationInterface, QueryRunner } from "typeorm";

export class ReferralSalonScope2130000000000 implements MigrationInterface {
  name = "ReferralSalonScope2130000000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "salonId" uuid NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_referrals_salon" ON "referrals" ("salonId")`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referrals_salon"`);
    await queryRunner.query(`ALTER TABLE "referrals" DROP COLUMN IF EXISTS "salonId"`);
  }
}

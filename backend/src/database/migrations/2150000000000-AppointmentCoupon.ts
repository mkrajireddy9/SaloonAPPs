import { MigrationInterface, QueryRunner } from "typeorm";

export class AppointmentCoupon2150000000000 implements MigrationInterface {
  name = "AppointmentCoupon2150000000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "couponCode" varchar NULL`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "couponCode"`);
  }
}

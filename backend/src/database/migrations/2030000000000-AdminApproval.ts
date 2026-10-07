import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminApproval2030000000000 implements MigrationInterface {
  name = 'AdminApproval2030000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "adminApprovalStatus" varchar NOT NULL DEFAULT 'not_required'`);
    await queryRunner.query(`UPDATE "users" SET "adminApprovalStatus" = 'approved' WHERE "role" = 'admin' AND "adminApprovalStatus" = 'not_required'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "adminApprovalStatus"`);
  }
}

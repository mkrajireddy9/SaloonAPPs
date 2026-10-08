import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalonTenantCode2040000000000 implements MigrationInterface {
  name = 'SalonTenantCode2040000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "tenantCode" varchar`);
    await queryRunner.query(`UPDATE "salons" SET "tenantCode" = 'salon-' || replace(left("id"::text, 8), '-', '') WHERE "tenantCode" IS NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_salons_tenantCode" ON "salons" ("tenantCode")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_salons_tenantCode"`);
    await queryRunner.query(`ALTER TABLE "salons" DROP COLUMN IF EXISTS "tenantCode"`);
  }
}

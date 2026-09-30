import { MigrationInterface, QueryRunner } from 'typeorm';
export class BannerSalon1980000000000 implements MigrationInterface {
  name = 'BannerSalon1980000000000';
  async up(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`ALTER TABLE "banners" ADD COLUMN IF NOT EXISTS "salonId" uuid`); await queryRunner.query(`UPDATE "banners" SET "salonId" = (SELECT "id" FROM "salons" ORDER BY "createdAt" ASC LIMIT 1) WHERE "salonId" IS NULL`); }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN IF EXISTS "salonId"`); }
}

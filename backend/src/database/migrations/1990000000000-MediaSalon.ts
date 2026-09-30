import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaSalon1990000000000 implements MigrationInterface {
  name = 'MediaSalon1990000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "salonId" uuid`);
    await queryRunner.query(`UPDATE "media_assets" SET "salonId" = (SELECT "id" FROM "salons" ORDER BY "createdAt" ASC LIMIT 1) WHERE "salonId" IS NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS media_assets_salon_idx ON "media_assets" ("salonId")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS media_assets_salon_idx`);
    await queryRunner.query(`ALTER TABLE "media_assets" DROP COLUMN IF EXISTS "salonId"`);
  }
}

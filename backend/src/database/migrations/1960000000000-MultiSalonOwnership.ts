import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultiSalonOwnership1960000000000 implements MigrationInterface {
  name = 'MultiSalonOwnership1960000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "ownerId" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "salonId" uuid`);
    await queryRunner.query(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "salonId" uuid`);
    await queryRunner.query(`UPDATE "salons" SET "ownerId" = (SELECT "id" FROM "users" WHERE "role" = 'admin' ORDER BY "createdAt" ASC LIMIT 1) WHERE "ownerId" IS NULL`);
    await queryRunner.query(`INSERT INTO "salons" ("name", "location", "ownerId") SELECT concat(u."name", '''s Salon'''), 'Add your salon location', u."id" FROM "users" u WHERE u."role" = 'admin' AND NOT EXISTS (SELECT 1 FROM "salons" s WHERE s."ownerId" = u."id")`);
    await queryRunner.query(`UPDATE "users" u SET "salonId" = COALESCE((SELECT s."id" FROM "salons" s WHERE s."ownerId" = u."id" LIMIT 1), (SELECT "id" FROM "salons" ORDER BY "createdAt" ASC LIMIT 1)) WHERE u."salonId" IS NULL`);
    await queryRunner.query(`UPDATE "appointments" SET "salonId" = (SELECT "id" FROM "salons" ORDER BY "createdAt" ASC LIMIT 1) WHERE "salonId" IS NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN IF EXISTS "salonId"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "salonId"`);
    await queryRunner.query(`ALTER TABLE "salons" DROP COLUMN IF EXISTS "ownerId"`);
  }
}

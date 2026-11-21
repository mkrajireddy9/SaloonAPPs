import { MigrationInterface, QueryRunner } from "typeorm";

export class SalonWishlists2170000000000 implements MigrationInterface {
  name = "SalonWishlists2170000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "salon_wishlists" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL,
      "salonId" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_salon_wishlists" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_salon_wishlists_user_salon" ON "salon_wishlists" ("userId", "salonId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_salon_wishlists_user" ON "salon_wishlists" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_salon_wishlists_salon" ON "salon_wishlists" ("salonId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "salon_wishlists"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class SalonGallery2180000000000 implements MigrationInterface {
  name = "SalonGallery2180000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "galleryImages" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "salons" DROP COLUMN IF EXISTS "galleryImages"`,
    );
  }
}

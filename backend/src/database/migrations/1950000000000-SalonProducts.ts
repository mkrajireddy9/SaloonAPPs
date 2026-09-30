import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalonProducts1950000000000 implements MigrationInterface {
  name = 'SalonProducts1950000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "products" jsonb NOT NULL DEFAULT '[]'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salons" DROP COLUMN IF EXISTS "products"`);
  }
}

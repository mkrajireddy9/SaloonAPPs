import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalonTheme1800000000000 implements MigrationInterface {
  name = 'SalonTheme1800000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "theme" jsonb NOT NULL DEFAULT '{"brandName":"halo","logoMark":"h","logoUrl":"","primary":"#b9533a","sidebar":"#20352d","surface":"#f7f5f0","ink":"#25372f"}'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "salons" DROP COLUMN IF EXISTS "theme"');
  }
}

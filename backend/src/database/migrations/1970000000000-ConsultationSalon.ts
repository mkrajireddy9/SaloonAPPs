import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsultationSalon1970000000000 implements MigrationInterface {
  name = 'ConsultationSalon1970000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "salonId" uuid`);
    await queryRunner.query(`UPDATE "consultations" SET "salonId" = (SELECT "id" FROM "salons" ORDER BY "createdAt" ASC LIMIT 1) WHERE "salonId" IS NULL`);
  }
  async down(queryRunner: QueryRunner): Promise<void> { await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN IF EXISTS "salonId"`); }
}

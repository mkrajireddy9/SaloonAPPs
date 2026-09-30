import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemainingSalonOwnership2000000000000 implements MigrationInterface {
  name = 'RemainingSalonOwnership2000000000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['reviews', 'payments', 'notifications', 'passports']) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "salonId" uuid`);
      await queryRunner.query(`UPDATE "${table}" SET "salonId" = (SELECT "id" FROM "salons" ORDER BY "createdAt" ASC LIMIT 1) WHERE "salonId" IS NULL`);
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS ${table}_salon_idx ON "${table}" ("salonId")`);
    }
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['reviews', 'payments', 'notifications', 'passports']) {
      await queryRunner.query(`DROP INDEX IF EXISTS ${table}_salon_idx`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "salonId"`);
    }
  }
}

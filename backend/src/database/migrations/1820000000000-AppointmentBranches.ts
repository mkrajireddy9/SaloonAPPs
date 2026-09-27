import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentBranches1820000000000 implements MigrationInterface {
  name = 'AppointmentBranches1820000000000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "branchId" varchar NOT NULL DEFAULT 'main'`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE appointments DROP COLUMN IF EXISTS "branchId"');
  }
}

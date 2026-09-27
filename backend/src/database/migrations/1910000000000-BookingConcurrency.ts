import { MigrationInterface, QueryRunner } from 'typeorm';

export class BookingConcurrency1910000000000 implements MigrationInterface {
  name = 'BookingConcurrency1910000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_uidx ON appointments (date, time, stylist, "branchId") WHERE status IN ('Requested', 'Confirmed')`); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('DROP INDEX IF EXISTS appointments_active_slot_uidx'); }
}

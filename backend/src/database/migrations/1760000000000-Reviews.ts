import { MigrationInterface, QueryRunner } from 'typeorm';

export class Reviews1760000000000 implements MigrationInterface {
  name = 'Reviews1760000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`CREATE TABLE IF NOT EXISTS reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "guestEmail" varchar NOT NULL, "guestName" varchar NOT NULL, "appointmentId" uuid NULL, rating integer NOT NULL, comment text NOT NULL DEFAULT '', status varchar NOT NULL DEFAULT 'Pending', "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`); await queryRunner.query('CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews (status)'); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('DROP TABLE IF EXISTS reviews'); }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomerProfiles1850000000000 implements MigrationInterface {
  name = 'CustomerProfiles1850000000000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar NULL');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS location varchar NULL');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS texture varchar NULL');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS length varchar NULL');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "preferredStylist" varchar NULL');
    await queryRunner.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS "customerId" uuid NULL');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS appointments_customer_id_idx ON appointments ("customerId")');
    await queryRunner.query('UPDATE appointments a SET "customerId" = u.id FROM users u WHERE a."customerId" IS NULL AND a."guestEmail" <> \'\' AND lower(a."guestEmail") = lower(u.email)');
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP INDEX IF EXISTS appointments_customer_id_idx');
    await queryRunner.query('ALTER TABLE appointments DROP COLUMN IF EXISTS "customerId"');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS "preferredStylist"');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS length');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS texture');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS location');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS phone');
  }
}

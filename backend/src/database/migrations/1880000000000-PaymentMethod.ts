import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentMethod1880000000000 implements MigrationInterface {
  name = 'PaymentMethod1880000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS "paymentMethod" varchar NOT NULL DEFAULT 'PAY_AT_SALON'`); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('ALTER TABLE payments DROP COLUMN IF EXISTS "paymentMethod"'); }
}

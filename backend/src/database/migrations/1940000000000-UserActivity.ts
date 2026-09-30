import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserActivity1940000000000 implements MigrationInterface {
  name = 'UserActivity1940000000000';
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLogoutAt" TIMESTAMP WITH TIME ZONE`);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastLogoutAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastLoginAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "lastSeenAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "active"`);
  }
}

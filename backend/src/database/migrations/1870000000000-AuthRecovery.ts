import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthRecovery1870000000000 implements MigrationInterface {
  name = 'AuthRecovery1870000000000';
  async up(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" varchar NULL');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" timestamptz NULL');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerificationTokenHash" varchar NULL');
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerificationExpiresAt" timestamptz NULL');
    await queryRunner.query('UPDATE users SET "emailVerified" = true WHERE "emailVerified" = false AND email IN (\'admin@halo.local\', \'guest@halo.local\')');
  }
  async down(queryRunner: QueryRunner) { for (const column of ['emailVerificationExpiresAt', 'emailVerificationTokenHash', 'passwordResetExpiresAt', 'passwordResetTokenHash', 'emailVerified']) await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "${column}"`); }
}

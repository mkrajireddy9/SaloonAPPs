import { MigrationInterface, QueryRunner } from "typeorm";

export class PlatformAdminRole2060000000000 implements MigrationInterface {
  name = "PlatformAdminRole2060000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'platform_admin'`,
    );
  }

  async down(): Promise<void> {
    // PostgreSQL does not support removing an enum value safely in place.
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class TenantIntegrity2100000000000 implements MigrationInterface {
  name = "TenantIntegrity2100000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "salons" SET "tenantCode" = 'salon-' || replace(left("id"::text, 8), '-', '') WHERE "tenantCode" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "salons" ALTER COLUMN "tenantCode" SET NOT NULL`,
    );

    const tenantTables = [
      "appointments",
      "consultations",
      "banners",
      "notifications",
      "payments",
      "passports",
      "reviews",
    ];
    for (const table of tenantTables) {
      await queryRunner.query(`
        UPDATE "${table}"
        SET "salonId" = (SELECT "id" FROM "salons" ORDER BY "createdAt" ASC LIMIT 1)
        WHERE "salonId" IS NULL
      `);
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "salonId" SET NOT NULL`,
      );
    }

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "users"
        ADD CONSTRAINT "users_role_tenant_check"
        CHECK (
          ("role" <> 'admin' OR "salonId" IS NOT NULL)
          AND ("role" <> 'platform_admin' OR "salonId" IS NULL)
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_tenant_check"`,
    );
    for (const table of [
      "appointments",
      "consultations",
      "banners",
      "notifications",
      "payments",
      "passports",
      "reviews",
    ])
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "salonId" DROP NOT NULL`,
      );
    await queryRunner.query(
      `ALTER TABLE "salons" ALTER COLUMN "tenantCode" DROP NOT NULL`,
    );
  }
}

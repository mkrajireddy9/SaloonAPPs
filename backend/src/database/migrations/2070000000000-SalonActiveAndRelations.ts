import { MigrationInterface, QueryRunner } from "typeorm";

export class SalonActiveAndRelations2070000000000
  implements MigrationInterface
{
  name = "SalonActiveAndRelations2070000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "salons" ADD COLUMN IF NOT EXISTS "active" boolean NOT NULL DEFAULT true`,
    );
    const relations = [
      ["users", "salonId", "salons", "id", "users_salon_fk"],
      ["salons", "ownerId", "users", "id", "salons_owner_fk"],
      ["appointments", "salonId", "salons", "id", "appointments_salon_fk"],
      ["appointments", "customerId", "users", "id", "appointments_customer_fk"],
      ["consultations", "salonId", "salons", "id", "consultations_salon_fk"],
      ["banners", "salonId", "salons", "id", "banners_salon_fk"],
      ["media_assets", "salonId", "salons", "id", "media_salon_fk"],
      ["notifications", "salonId", "salons", "id", "notifications_salon_fk"],
      ["payments", "salonId", "salons", "id", "payments_salon_fk"],
      ["passports", "salonId", "salons", "id", "passports_salon_fk"],
      ["reviews", "salonId", "salons", "id", "reviews_salon_fk"],
    ];
    // Existing rows from early multi-tenant versions may contain references
    // to deleted tenants. Null those orphaned references before validating the
    // new foreign keys so deployment cannot fail on legacy data.
    for (const [table, column, parent] of relations) {
      await queryRunner.query(`
        UPDATE "${table}"
        SET "${column}" = NULL
        WHERE "${column}" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "${parent}" p WHERE p."id" = "${table}"."${column}"
          )
      `);
    }
    for (const [table, column, parent, parentColumn, constraint] of relations) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "${table}"
          ADD CONSTRAINT "${constraint}"
          FOREIGN KEY ("${column}") REFERENCES "${parent}" ("${parentColumn}")
          ON DELETE SET NULL NOT VALID;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
      await queryRunner.query(
        `ALTER TABLE "${table}" VALIDATE CONSTRAINT "${constraint}"`,
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const relations = [
      ["users", "users_salon_fk"],
      ["salons", "salons_owner_fk"],
      ["appointments", "appointments_salon_fk"],
      ["appointments", "appointments_customer_fk"],
      ["consultations", "consultations_salon_fk"],
      ["banners", "banners_salon_fk"],
      ["media_assets", "media_salon_fk"],
      ["notifications", "notifications_salon_fk"],
      ["payments", "payments_salon_fk"],
      ["passports", "passports_salon_fk"],
      ["reviews", "reviews_salon_fk"],
    ];
    for (const [table, constraint] of relations)
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`,
      );
    await queryRunner.query(
      `ALTER TABLE "salons" DROP COLUMN IF EXISTS "active"`,
    );
  }
}

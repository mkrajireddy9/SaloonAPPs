import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditSalon2080000000000 implements MigrationInterface {
  name = "AuditSalon2080000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "salonId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS audit_logs_salon_idx ON "audit_logs" ("salonId")`,
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "audit_logs"
        ADD CONSTRAINT "audit_logs_salon_fk"
        FOREIGN KEY ("salonId") REFERENCES "salons" ("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_salon_fk"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS audit_logs_salon_idx`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "salonId"`,
    );
  }
}

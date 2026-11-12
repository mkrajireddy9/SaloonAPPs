import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueSalonOwner2090000000000 implements MigrationInterface {
  name = "UniqueSalonOwner2090000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates = await queryRunner.query(
      `SELECT "ownerId" FROM "salons" WHERE "ownerId" IS NOT NULL GROUP BY "ownerId" HAVING COUNT(*) > 1 LIMIT 1`,
    );
    if (duplicates.length)
      throw new Error(
        "Cannot enforce unique salon ownership: duplicate salon ownerId values exist",
      );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_salons_ownerId" ON "salons" ("ownerId") WHERE "ownerId" IS NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_salons_ownerId"`,
    );
  }
}

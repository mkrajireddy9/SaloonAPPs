import { MigrationInterface, QueryRunner } from "typeorm";

export class Memberships2110000000000 implements MigrationInterface {
  name = "Memberships2110000000000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "membership_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "salonId" uuid NOT NULL, "name" character varying NOT NULL, "price" integer NOT NULL DEFAULT 0, "sessionCount" integer NOT NULL DEFAULT 1, "validityDays" integer NOT NULL DEFAULT 30, "eligibleServices" jsonb NOT NULL DEFAULT '[]', "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_membership_plans_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_membership_plans_salon" ON "membership_plans" ("salonId")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "salonId" uuid NOT NULL, "customerId" uuid NULL, "guestEmail" character varying NOT NULL, "planId" uuid NOT NULL, "amountPaid" integer NOT NULL DEFAULT 0, "totalSessions" integer NOT NULL, "remainingSessions" integer NOT NULL, "startsAt" date NOT NULL, "expiresAt" date NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_memberships_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_memberships_salon" ON "memberships" ("salonId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_memberships_email" ON "memberships" ("guestEmail")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "membership_usages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "membershipId" uuid NOT NULL, "salonId" uuid NOT NULL, "appointmentId" uuid NULL, "service" character varying NOT NULL, "sessionsUsed" integer NOT NULL DEFAULT 1, "serviceCost" integer NOT NULL DEFAULT 0, "usedByEmail" character varying NOT NULL, "usedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_membership_usages_id" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_membership_usages_membership" ON "membership_usages" ("membershipId")`);
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS "membership_usages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "memberships"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "membership_plans"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await queryRunner.query("DO $$ BEGIN CREATE TYPE users_role_enum AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar NOT NULL, email varchar NOT NULL UNIQUE,
      "passwordHash" varchar NOT NULL, role users_role_enum NOT NULL DEFAULT 'user',
      "refreshTokenHash" varchar NULL, "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "refreshTokenHash" varchar NULL');
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS appointments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "guestName" varchar NOT NULL DEFAULT 'Ananya Rao',
      "guestEmail" varchar NOT NULL DEFAULT '', service varchar NOT NULL, date varchar NOT NULL, time varchar NOT NULL,
      stylist varchar NOT NULL DEFAULT 'Meera Nair', notes varchar NOT NULL DEFAULT '', status varchar NOT NULL DEFAULT 'Requested',
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS appointments_slot_idx ON appointments (date, time, stylist)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS consultations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "guestName" varchar NOT NULL, phone varchar NOT NULL DEFAULT '',
      stylist varchar NOT NULL DEFAULT 'Meera Nair', goal varchar NOT NULL DEFAULT 'A cut that feels like me',
      length varchar NOT NULL DEFAULT 'Shoulder length', texture varchar NOT NULL DEFAULT 'Wavy',
      "capturedViews" varchar NOT NULL DEFAULT 'front,left,right', report jsonb NULL,
      status varchar NOT NULL DEFAULT 'draft', "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS salons (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar NOT NULL DEFAULT 'Halo Studio',
      location varchar NOT NULL DEFAULT 'Indiranagar, Bengaluru', services jsonb NOT NULL DEFAULT '[]',
      stylists jsonb NOT NULL DEFAULT '[]', "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS passports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), "ownerEmail" varchar NOT NULL UNIQUE,
      "guestName" varchar NOT NULL DEFAULT 'Ananya Rao', location varchar NOT NULL DEFAULT 'Hyderabad',
      texture varchar NOT NULL DEFAULT 'Wavy', length varchar NOT NULL DEFAULT 'Shoulder length',
      "preferredStylist" varchar NOT NULL DEFAULT 'Meera Nair', preferences jsonb NOT NULL DEFAULT '[]',
      notes varchar NOT NULL DEFAULT '', styles jsonb NOT NULL DEFAULT '[]', history jsonb NOT NULL DEFAULT '[]',
      "beforeImage" varchar NOT NULL DEFAULT '/images/hair-before.svg', "afterImage" varchar NOT NULL DEFAULT '/images/hair-lob.svg',
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
    )`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP TABLE IF EXISTS passports');
    await queryRunner.query('DROP TABLE IF EXISTS salons');
    await queryRunner.query('DROP TABLE IF EXISTS consultations');
    await queryRunner.query('DROP TABLE IF EXISTS appointments');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TYPE IF EXISTS users_role_enum');
  }
}

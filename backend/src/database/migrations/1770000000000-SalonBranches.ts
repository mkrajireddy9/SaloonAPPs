import { MigrationInterface, QueryRunner } from 'typeorm';

export class SalonBranches1770000000000 implements MigrationInterface {
  name = 'SalonBranches1770000000000';
  async up(queryRunner: QueryRunner) { await queryRunner.query(`ALTER TABLE salons ADD COLUMN IF NOT EXISTS branches jsonb NOT NULL DEFAULT '[]'`); await queryRunner.query(`UPDATE salons SET branches = jsonb_build_array(jsonb_build_object('id','main','name',name,'location',location,'openingHours',"openingHours",'closedDays',"closedDays")) WHERE branches = '[]'::jsonb`); }
  async down(queryRunner: QueryRunner) { await queryRunner.query('ALTER TABLE salons DROP COLUMN IF EXISTS branches'); }
}

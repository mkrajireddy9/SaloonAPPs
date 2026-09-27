import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedServiceCatalog1750000000000 implements MigrationInterface {
  name = 'SeedServiceCatalog1750000000000';
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`UPDATE salons SET "serviceDetails" = '[{"name":"Signature cut","durationMinutes":60,"price":1840},{"name":"Texture refresh","durationMinutes":75,"price":2200},{"name":"Colour consultation","durationMinutes":45,"price":1200},{"name":"Gloss refresh","durationMinutes":60,"price":1600}]'::jsonb WHERE "serviceDetails" = '[]'::jsonb`);
  }
  async down() {}
}

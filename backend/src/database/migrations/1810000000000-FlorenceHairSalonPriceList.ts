import { MigrationInterface, QueryRunner } from 'typeorm';

const items = [
  { name: 'Rebond w/ Brazilian', durationMinutes: 180, price: 8500, active: true },
  { name: 'Rebond w/ Brazilian (Shoulder level)', durationMinutes: 150, price: 2000, active: true },
  { name: 'Rebond w/ Hair Cellophane package', durationMinutes: 120, price: 2199, active: true },
  { name: 'Rebond w/ Hair Treatment', durationMinutes: 120, price: 1999, active: true },
  { name: 'Brazilian', durationMinutes: 120, price: 1499, active: true },
  { name: 'Color w/ Hair Cellophane', durationMinutes: 120, price: 1200, active: true },
  { name: 'Color w/ Hair Cellophane (Shoulder level)', durationMinutes: 100, price: 950, active: true },
  { name: 'Color w/ Hair Cellophane (Men)', durationMinutes: 90, price: 800, active: true },
  { name: 'Hair Cellophane', durationMinutes: 90, price: 500, active: true },
  { name: 'Hair Spa', durationMinutes: 60, price: 599, active: true },
  { name: 'Hair Curl Permanent', durationMinutes: 150, price: 1100, active: true },
  { name: 'Temporary Curl', durationMinutes: 60, price: 500, active: true },
  { name: 'Hair Cut (Women)', durationMinutes: 60, price: 700, active: true },
  { name: 'Hair Cut (Men)', durationMinutes: 45, price: 70, active: true },
  { name: 'Hair Shampoo', durationMinutes: 30, price: 50, active: true },
  { name: 'Hair Extension', durationMinutes: 180, price: 3500, active: true },
  { name: 'Foot Spa w/ Manicure Pedicure', durationMinutes: 60, price: 550, active: true },
  { name: 'Manicure', durationMinutes: 45, price: 100, active: true },
  { name: 'Pedicure', durationMinutes: 45, price: 100, active: true },
  { name: 'Nail Gel', durationMinutes: 60, price: 450, active: true },
  { name: 'Foot Massage (30 minutes)', durationMinutes: 30, price: 100, active: true },
  { name: 'Whole Body Massage', durationMinutes: 90, price: 300, active: true },
  { name: 'Cluster Eyelash Extensions', durationMinutes: 90, price: 850, active: true },
  { name: 'Eyebrows Shaping / Kilay', durationMinutes: 30, price: 50, active: true },
];

export class FlorenceHairSalonPriceList1810000000000 implements MigrationInterface {
  name = 'FlorenceHairSalonPriceList1810000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const names = items.map(item => item.name);
    await queryRunner.query('UPDATE salons SET services = $1::jsonb, "serviceDetails" = $2::jsonb', [JSON.stringify(names), JSON.stringify(items)]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE salons SET services = '["Signature cut","Texture refresh","Colour consultation","Gloss refresh"]'::jsonb, "serviceDetails" = '[{"name":"Signature cut","durationMinutes":60,"price":1840,"active":true},{"name":"Texture refresh","durationMinutes":75,"price":2200,"active":true},{"name":"Colour consultation","durationMinutes":45,"price":1200,"active":true},{"name":"Gloss refresh","durationMinutes":60,"price":1600,"active":true}]'::jsonb`);
  }
}

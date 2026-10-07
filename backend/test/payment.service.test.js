const test = require('node:test');
const assert = require('node:assert/strict');
const { PaymentService } = require('../dist/payments/payment.service.js');
const { UserRole } = require('../dist/auth/user.entity.js');

test('payment creation rejects an appointment the guest does not own', async () => {
  const payments = { findOne: async () => null };
  const appointments = { findOne: async () => ({ id: 'appointment-1', guestEmail: 'owner@example.com', status: 'Requested' }) };
  const service = new PaymentService(payments, appointments);
  await assert.rejects(() => service.create({ appointmentId: 'appointment-1', idempotencyKey: 'key-1' }, { email: 'other@example.com', role: UserRole.USER }), /cannot pay for this appointment/);
});

test('payment creation reports a missing appointment', async () => {
  const service = new PaymentService({ findOne: async () => null }, { findOne: async () => null });
  await assert.rejects(() => service.create({ appointmentId: 'missing', idempotencyKey: 'key-2' }, { email: 'guest@example.com', role: UserRole.USER }), /Appointment not found/);
});

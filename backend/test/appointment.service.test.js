const test = require('node:test');
const assert = require('node:assert/strict');
const { AppointmentService } = require('../dist/appointments/appointment.service.js');
const { UserRole } = require('../dist/auth/user.entity.js');

test('guest cannot cancel another customer appointment', async () => {
  const repo = { findOne: async () => null };
  const service = new AppointmentService(repo, {}, {}, {});
  await assert.rejects(() => service.cancel('appointment-1', { id: 'guest-1', email: 'guest@example.com', role: UserRole.USER }), /Appointment not found/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { AuthService } = require('../dist/auth/auth.service.js');
const { AdminApprovalStatus, UserRole } = require('../dist/auth/user.entity.js');

function serviceWith(user) {
  const saved = [];
  const users = {
    findOne: async () => null,
    create: value => value,
    save: async value => { const savedUser = { id: value.id || 'user-1', ...value }; saved.push(savedUser); return savedUser; },
    query: async () => undefined,
    createQueryBuilder: () => ({ addSelect: () => ({ where: () => ({ getOne: async () => user }) }) }),
  };
  const salons = { create: value => value, save: async value => ({ id: 'salon-1', ...value }) };
  const jwt = { sign: payload => JSON.stringify(payload) };
  return { service: new AuthService(users, salons, jwt), saved };
}

test('admin registration creates a pending approval request', async () => {
  process.env.ADMIN_INVITE_CODE = 'local-admin-code-123456';
  const { service, saved } = serviceWith(null);
  const result = await service.register({ name: 'Owner', email: 'OWNER@example.com', password: 'strong-password', role: UserRole.ADMIN, inviteCode: process.env.ADMIN_INVITE_CODE });
  assert.equal(result.pendingApproval, true);
  assert.equal(saved[0].email, 'owner@example.com');
  assert.equal(saved[0].adminApprovalStatus, AdminApprovalStatus.PENDING);
});

test('pending admin cannot log in', async () => {
  const user = { id: 'user-1', email: 'owner@example.com', passwordHash: await bcrypt.hash('strong-password', 4), role: UserRole.ADMIN, adminApprovalStatus: AdminApprovalStatus.PENDING, active: true, emailVerified: true };
  const { service } = serviceWith(user);
  await assert.rejects(() => service.login({ email: user.email, password: 'strong-password' }), /awaiting approval/);
});

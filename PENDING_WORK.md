# Pending Work and Verification Checklist

Last updated: 2026-11-12

## Current implementation status

- P0 security fixes: implemented and pushed in commit `7a5f7c0`.
- P1 tenant integrity fixes: implemented and pushed in commit `d122593`.
- P2 platform monitoring and session controls: implemented and pushed in commit `c7f560d`.
- Backend and frontend production builds pass.
- Backend service tests pass.
- Full deployed-app flow and live database migration verification are still pending.

## P3 improvements

### Security and infrastructure

- [ ] Replace in-memory global rate limiting with shared Redis or equivalent storage.
- [ ] Replace in-memory authentication rate limits with shared storage.
- [ ] Add cleanup/expiration for rate-limit keys.
- [ ] Configure trusted proxy handling before accepting `X-Forwarded-For`.
- [ ] Add Content-Security-Policy headers.
- [ ] Add Strict-Transport-Security headers in production.
- [ ] Restrict, protect, or disable public Swagger documentation in production.
- [ ] Review frontend token storage and consider a secure httpOnly-cookie session strategy.

### Testing and quality

- [ ] Add HTTP-level authorization tests using two separate salons.
- [ ] Verify salon-admin read/write isolation across appointments, customers, payments, reviews, media, notifications, consultations, and settings.
- [ ] Verify platform-admin access across all tenants.
- [ ] Verify suspended salons immediately reject existing admin sessions.
- [ ] Add Google-admin registration and approval tests.
- [ ] Add migration tests against a representative database snapshot.
- [ ] Add production smoke tests for login, refresh, logout, approval, booking, and suspension.

### Performance and operations

- [ ] Optimize platform salon/admin listing to avoid N+1 user queries.
- [ ] Optimize platform dashboard aggregation for many salons.
- [ ] Add indexes and query monitoring for high-volume tenant-owned tables.
- [ ] Add metrics for authentication failures, rate limits, tenant denials, and migration failures.
- [ ] Add alerting for repeated authorization failures and suspended-tenant access attempts.

## Operational work still required

- [ ] Apply migrations `2080000000000`, `2090000000000`, and `2100000000000` to the real database.
- [ ] Before migration `2090000000000`, check for duplicate non-null salon owners.
- [ ] Before migration `2100000000000`, verify tenant-owned records can be assigned to a valid salon.
- [ ] Confirm production platform-admin credentials are configured.
- [ ] Confirm `PLATFORM_ADMIN_TEST_LOGIN` is not relied on in production.
- [ ] Confirm `DATABASE_URL`, `JWT_SECRET`, `ADMIN_INVITE_CODE`, `FRONTEND_URL`, CORS, email, and payment settings.
- [ ] Confirm production email verification and password recovery delivery.
- [ ] Confirm backups and restore procedures before production rollout.

## Before-live release checks

These checks must pass before enabling real users in production:

- [ ] Apply migrations `2080000000000`, `2090000000000`, and `2100000000000` in the production database.
- [ ] Confirm migration `2090000000000` finds no duplicate non-null salon owners.
- [ ] Confirm migration `2100000000000` assigns every tenant-owned record to a valid salon.
- [ ] Run the complete customer workflow in the deployed environment.
- [ ] Run the complete salon-admin registration, approval, login, and management workflow.
- [ ] Run the complete platform-admin salon, tenant-code, approval, suspension, and monitoring workflow.
- [ ] Run cross-tenant negative tests against the deployed API using two salons.
- [ ] Verify suspended salons immediately invalidate existing admin sessions.
- [ ] Verify production environment variables, email delivery, CORS, payment settings, and platform-admin credentials.
- [ ] Verify database backup and restore before launch.
- [ ] Confirm no unresolved 5xx errors in deployment logs during smoke testing.

## Complete app-flow verification

### Customer flow

- [ ] Register with email and password.
- [ ] Log in with the same credentials.
- [ ] Verify email in production mode.
- [ ] Browse active salons.
- [ ] Select a salon and branch.
- [ ] View services, stylists, and available slots.
- [ ] Create an appointment.
- [ ] View, reschedule, and cancel only the customer’s own appointment.
- [ ] Create a payment or pay-at-salon record.
- [ ] View only the customer’s own payments, passport, reviews, media, and notifications.

### Salon-admin flow

- [ ] Platform admin creates a salon and tenant code.
- [ ] Salon admin registers with the tenant code and invite code.
- [ ] Registration remains pending.
- [ ] Platform admin sees the applicant, salon, and tenant code.
- [ ] Platform admin approves the applicant.
- [ ] Admin logs in with email, password, and tenant code.
- [ ] Admin can access only the assigned salon.
- [ ] Admin manages salon profile, services, branches, staff, customers, appointments, reviews, payments, media, and notifications.
- [ ] Tampering with `salonId` is rejected.
- [ ] Admin cannot access another salon’s records.
- [ ] Admin cannot access platform-admin endpoints.

### Platform-admin flow

- [ ] Platform admin logs in through the production database-backed account.
- [ ] View all salons and assigned salon admins.
- [ ] Create salons and tenant codes.
- [ ] Rotate tenant codes.
- [ ] Approve and reject admin requests.
- [ ] Activate and suspend salons.
- [ ] View platform-wide metrics grouped by salon.
- [ ] Verify suspended salon sessions stop working immediately.
- [ ] Verify platform actions are audited.

### Failure and recovery flow

- [ ] Expired access token refreshes correctly.
- [ ] Logout revokes the refresh token.
- [ ] Deactivated users cannot use existing sessions.
- [ ] Rejected and pending admins cannot access salon features.
- [ ] Rotated tenant codes prevent new login with the old code.
- [ ] Invalid tenant IDs never expose another tenant’s data.
- [ ] Rate limits trigger correctly for login, registration, reset, and verification endpoints.
- [ ] Database backup and restore procedure succeeds.

## Release gate

The application should not be considered fully verified until:

1. The live database migrations complete successfully.
2. Customer, salon-admin, and platform-admin flows pass in the deployed environment.
3. Cross-tenant negative tests pass through real HTTP APIs.
4. Suspension, logout, refresh, and approval behavior are verified with existing sessions.
5. Backups, email delivery, CORS, secrets, and monitoring are confirmed in production.

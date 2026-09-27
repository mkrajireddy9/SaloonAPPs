# Halo Salon Go-Live Testing Guide

This guide covers the remaining production-readiness checks for the Halo Salon application. Run all destructive tests against a staging database, never against production.

## 1. Test Environment

Create a separate staging environment with:

- A staging PostgreSQL database.
- A staging backend URL using HTTPS.
- A staging frontend URL.
- Test email addresses only.
- `PAYMENTS_ENABLED=false`.
- `WHATSAPP_ENABLED=false`.
- `MEDIA_STORAGE=local` until Cloudinary is configured and verified.

Required backend environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<staging-postgresql-url>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
ADMIN_INVITE_CODE=<private-admin-invite-code>
CORS_ORIGINS=https://<frontend-domain>
FRONTEND_URL=https://<frontend-domain>
ALLOW_EMPTY_LOGIN=false
PAYMENTS_ENABLED=false
EMAIL_REMINDERS_ENABLED=true
WHATSAPP_ENABLED=false
MEDIA_STORAGE=local
MEDIA_MAX_BYTES=5242880
MEDIA_RETENTION_DAYS=365
RESEND_API_KEY=
EMAIL_FROM=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Do not commit `.env`, database URLs, API keys, JWT secrets, or provider secrets.

## 2. Local Verification Commands

From the repository root:

```bash
npm ci
npm run build
npm test --workspace backend
npm test --workspace frontend
git diff --check
```

Run the dependency audit when registry access is available:

```bash
npm audit --audit-level=high
```

Start the application locally:

```bash
npm run start --workspace backend
npm run dev --workspace frontend -- --host 0.0.0.0
```

Verify:

```bash
curl -i http://localhost:3000/health
curl -I http://localhost:5173/
```

Expected health response:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

Swagger is available at `/docs`.

## 3. Authentication Testing

### Registration

1. Register a guest with a valid email and an 8-character-or-longer password.
2. Confirm the user is created in the `users` table.
3. Confirm a verification token hash and expiry are stored, never the raw token.
4. Register an admin without the invite code and confirm it is rejected.
5. Register an admin with the correct invite code and confirm it succeeds.

### Login

1. Login with valid credentials.
2. Confirm access and refresh tokens are returned.
3. Confirm empty email/password login is rejected when `ALLOW_EMPTY_LOGIN=false`.
4. Confirm an unverified production user cannot log in.
5. Confirm an invalid password returns a generic error.
6. Confirm the response never contains a password hash, JWT secret, or refresh-token hash.

### Password reset

1. Call `POST /auth/forgot-password` with an existing email.
2. Call it with a nonexistent email.
3. Confirm both responses are identical and do not reveal whether the account exists.
4. Confirm a reset email is received when Resend is configured.
5. Use the link at `/reset-password?token=...`.
6. Set a new password and confirm the token hash and expiry are cleared.
7. Reuse the same token and confirm it is rejected.
8. Wait for or simulate expiry and confirm the token is rejected.
9. Send repeated reset requests and confirm rate limiting applies.

### Email verification

1. Register a new test user.
2. Confirm the verification email is received.
3. Open `/verify-email?token=...`.
4. Confirm `users.emailVerified` becomes `true`.
5. Reuse the token and confirm it is rejected.
6. Test `POST /auth/resend-verification`.
7. Confirm raw verification tokens never appear in logs.

## 4. Booking and Payment Testing

1. Create a guest appointment with a valid service, branch, stylist, date, and time.
2. Confirm the appointment is stored in PostgreSQL.
3. Confirm the server calculates duration and price from the salon catalog.
4. Change the frontend price and confirm the server ignores it.
5. Book outside opening hours and confirm rejection.
6. Book on a closed day and confirm rejection.
7. Book during stylist leave and confirm rejection.
8. Submit two simultaneous requests for the same stylist, branch, date, and time. Confirm only one succeeds.
9. Cancel from the guest account and confirm the admin sees the cancellation.
10. Reschedule into an occupied slot and confirm rejection.
11. With `PAYMENTS_ENABLED=false`, confirm no online payment API is called.
12. Confirm the UI says `Pay at salon`.
13. Create a payment record and confirm `paymentMethod=PAY_AT_SALON` and `status=Pending`.
14. Confirm payment totals are calculated server-side.
15. Confirm a guest cannot access another guest's appointment or payment.

## 5. Image Validation Testing

Test `POST /media/upload` with authenticated users.

Verify acceptance of:

- Valid JPEG.
- Valid PNG.
- Valid WEBP.
- Images between 100x100 and 8000x8000 pixels.
- Images below 40 megapixels and below 5 MB.

Verify rejection of:

- Empty files.
- `.exe`, `.js`, `.html`, and unsupported formats.
- A renamed executable with a `.jpg` extension.
- A file whose MIME type does not match its signature.
- Corrupted images.
- Images smaller than 100x100.
- Images larger than 8000x8000 or 40 megapixels.
- Files larger than 5 MB.

Confirm rejected temporary files are deleted. Confirm private image reads require authentication and that another user cannot delete or read the asset.

The current implementation validates format, signature, size, dimensions, and corruption. Malware scanning still requires an external scanner or managed storage security feature.

## 6. Email and WhatsApp Testing

### Resend setup

1. Create a Resend account.
2. Create an API key.
3. Verify a sender domain, or use the provider's allowed testing sender.
4. Set `RESEND_API_KEY` and `EMAIL_FROM` in the backend environment.
5. Restart the backend.
6. Test verification, reset, booking confirmation, cancellation, and reminder emails.
7. Confirm failed provider requests create a failed/queued notification record and do not roll back an appointment.
8. Confirm duplicate delivery is prevented for the same appointment, event, and channel.

### WhatsApp

WhatsApp remains disabled for the free MVP:

```env
WHATSAPP_ENABLED=false
```

Do not enable it without a provider, templates, sender number, credentials, delivery status, and provider billing configuration.

## 7. Cloudinary Testing

1. Create a Cloudinary account.
2. Create an upload/API configuration.
3. Set `MEDIA_STORAGE=cloudinary`.
4. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` only in the backend.
5. Restart the backend.
6. Upload a valid service or stylist image.
7. Confirm the file is present in Cloudinary and metadata is stored in `media_assets`.
8. Confirm `publicId`, width, height, format, and `storageProvider` are stored.
9. Request the image through `/media/:id` and confirm a temporary authenticated URL is returned or redirected.
10. Replace the image and confirm the old asset is deleted.
11. Delete the image and confirm both database and Cloudinary records are removed.
12. Disable Cloudinary credentials and confirm failed uploads do not leave orphaned local files or database rows.

## 8. Logging, Security, and Monitoring

1. Confirm every response includes `X-Request-Id`.
2. Confirm request logs contain timestamp, level, request ID, method, route, status, and response time.
3. Search logs and confirm they do not contain passwords, JWTs, authorization headers, API keys, reset tokens, or database credentials.
4. Confirm invalid requests return validation errors without SQL, stack traces, filesystem paths, or environment values.
5. Confirm CORS only allows configured origins.
6. Confirm request size and rate limits return HTTP 413/429 as appropriate.
7. Verify admin-only endpoints reject guest tokens even when called directly.
8. Test IDs from another customer account for appointments, payments, media, passport, and history.
9. Confirm booking price and duration cannot be overridden by the frontend.
10. Confirm audit rows are written for admin changes, appointment changes, moderation, media deletion, and customer updates.
11. Confirm `GET /health` returns HTTP 503 when PostgreSQL is unavailable.
12. Connect a free uptime monitor to `https://<backend-domain>/health`.

## 9. Backup, Restore, and Rollback

Create a backup:

```bash
DATABASE_URL='<staging-or-production-url>' ./scripts/backup-db.sh
```

Restore into a temporary database only:

```bash
DATABASE_URL='<temporary-test-database-url>' ./scripts/restore-db.sh backups/halo-<timestamp>.dump
```

After restore, verify these tables:

- `users`
- `salon`
- `appointments`
- `reviews`
- `payments`
- `notifications`
- `media_assets`
- `audit_logs`

Create release tags:

```bash
git tag v0.1.0
git push origin v0.1.0
```

For rollback, redeploy the last known-good tag and apply only safe forward migrations. Never automatically run destructive migration rollbacks against production.

## 10. Deployment Checklist

1. Create staging PostgreSQL on Supabase or another managed provider.
2. Deploy the backend to a Node-compatible host.
3. Set all backend environment variables in the host dashboard.
4. Confirm backend health over HTTPS.
5. Deploy the Vite frontend as a static site.
6. Set `VITE_API_URL` to the HTTPS backend URL.
7. Confirm CORS allows only the frontend HTTPS origin.
8. Run the complete authentication and booking test suite against staging.
9. Configure a production database and take a backup before first release.
10. Apply migrations during deployment.
11. Configure automatic restart and health checks.
12. Use provider-generated HTTPS URLs first. Add a custom domain only after the free deployment is stable.

## 11. Load Testing

Install k6 and run only against staging:

```bash
k6 run -e API_URL=https://<staging-backend> load/health.js
```

Record:

- Total requests.
- Successful requests.
- Failed requests.
- Average response time.
- p95 response time.

Do not run write-heavy booking tests against production without a controlled test dataset and cleanup plan.

## 12. Final Sign-Off

The application is ready for public launch only when:

- Authentication and recovery pass.
- Email delivery passes with Resend.
- Payment mode is explicitly documented as Pay at Salon or a real gateway is tested.
- Image validation and access-control tests pass.
- Database backup restoration succeeds.
- HTTPS deployment passes.
- Health monitoring is active.
- Security and authorization tests pass.
- Staging load and recovery tests pass.
- Production secrets are configured outside Git.

AI analysis and virtual try-on are intentionally excluded from this Version 1 launch checklist.

# Production Release Pending Checklist

This checklist contains the remaining items before releasing Halo to production.

## 1. Render deployment

- [ ] Push the validated changes to the deployment branch.
- [ ] Deploy the backend and frontend services on Render.
- [ ] Confirm both services show `Live`.
- [ ] Confirm the backend health endpoint responds successfully.
- [ ] Confirm the frontend uses the production backend URL through `NEXT_PUBLIC_API_URL`.
- [ ] Confirm the mobile app uses the production backend URL through `EXPO_PUBLIC_API_URL`.
- [ ] Confirm HTTPS and the production domains work without certificate errors.

## 2. Backend environment variables

- [ ] Set `NODE_ENV=production`.
- [ ] Configure the production `DATABASE_URL` with `sslmode=require`.
- [ ] Configure a strong, unique `JWT_SECRET`.
- [ ] Configure `ADMIN_INVITE_CODE`.
- [ ] Configure `PLATFORM_ADMIN_EMAIL` and `PLATFORM_ADMIN_PASSWORD` securely.
- [ ] Configure `FRONTEND_URL` with the deployed frontend URL.
- [ ] Configure `RESEND_API_KEY`, `EMAIL_FROM`, and a verified email domain.
- [ ] Configure production CORS origins.
- [ ] Confirm no local or test-login credentials are enabled in production.

## 3. Database and tenant safety

- [ ] Confirm the migration `2070000000000-SalonActiveAndRelations` runs successfully.
- [ ] Confirm all expected tables and foreign-key constraints exist.
- [ ] Confirm no orphaned tenant, appointment, customer, payment, media, or review records remain.
- [ ] Confirm platform admins can see global data.
- [ ] Confirm salon admins can access only their assigned salon.
- [ ] Confirm guests cannot access another customer's data.
- [ ] Create and test a database backup.
- [ ] Perform a restore test using a safe database branch or staging database.

## 4. Authentication and authorization

- [ ] Test guest registration and login.
- [ ] Test salon-admin registration with a valid tenant code.
- [ ] Test that an invalid or inactive tenant code is rejected.
- [ ] Test salon-admin login with the correct tenant code.
- [ ] Test platform-admin login without a tenant code.
- [ ] Test admin approval and rejection from the platform-admin workspace.
- [ ] Test account deactivation and reactivation.
- [ ] Test email verification.
- [ ] Test forgot-password and reset-password flows.
- [ ] Rotate any credentials that were exposed in local files, logs, screenshots, or chat.

## 5. Image and file storage

- [ ] Configure permanent production image storage such as Cloudinary or S3-compatible storage.
- [ ] Confirm `MEDIA_STORAGE` and all storage credentials are configured.
- [ ] Test JPG, PNG, and WebP upload flows.
- [ ] Test invalid file type, corrupt image, oversized image, and missing-file errors.
- [ ] Confirm AI images remain available after a backend restart or redeploy.
- [ ] Confirm private customer images cannot be accessed without authorization.

## 6. AI hairstyle features

- [ ] Configure `GEMINI_API_KEY` securely.
- [ ] Configure an allowed analysis model and image-generation model.
- [ ] Confirm Gemini quota and billing are sufficient for expected usage.
- [ ] Test successful analysis and recommendation generation.
- [ ] Test invalid recommendation responses.
- [ ] Test Gemini `429` quota responses and user-friendly retry messaging.
- [ ] Test image-generation failure and job retry/status behavior.
- [ ] Confirm daily analysis and generation limits are appropriate.

## 7. Appointments and payments

- [ ] Test salon, branch, service, and stylist selection.
- [ ] Test appointment creation, confirmation, cancellation, and rescheduling.
- [ ] Test inactive salons and branches cannot accept appointments.
- [ ] Configure the real payment provider and webhook secrets if online payments are enabled.
- [ ] Test pay-at-salon flow.
- [ ] Test online payment success, failure, duplicate request, refund, and webhook flows.
- [ ] Confirm invoices are generated correctly.
- [ ] Confirm appointment notifications are delivered.

## 8. Frontend and mobile release

- [ ] Test the deployed web app on desktop and mobile browsers.
- [ ] Test the mobile app against the production API.
- [ ] Test guest navigation, AI Studio, Passport, appointments, payments, and account screens.
- [ ] Test mobile salon-admin login and admin workspace.
- [ ] Confirm platform-admin salon management remains available on web.
- [ ] Test logout, token refresh, expired sessions, and app restart behavior.
- [ ] Verify theme colors, responsive layouts, icons, banners, and carousel behavior.
- [ ] Build and sign the production mobile binaries.

## 9. Monitoring and operations

- [ ] Configure Render health checks and restart behavior.
- [ ] Configure error alerts for backend 5xx responses.
- [ ] Monitor database connection errors, migration failures, and slow requests.
- [ ] Monitor AI quota errors and failed generation jobs.
- [ ] Confirm structured logs do not contain passwords, tokens, API keys, or private images.
- [ ] Document rollback steps for backend, frontend, mobile, and database migrations.
- [ ] Document support contacts and incident response steps.

## 10. Final release sign-off

- [ ] Complete the full guest-to-appointment journey with real test accounts.
- [ ] Complete the full salon-admin journey with a real salon tenant.
- [ ] Complete the platform-admin approval and salon-management journey.
- [ ] Confirm all critical test results are recorded.
- [ ] Confirm product owner approval for production release.
- [ ] Tag the release commit and record the deployment timestamp.

## Current code validation

- Backend build and tests: passed.
- Frontend production build: passed.
- Mobile TypeScript validation: passed.
- Expo web export: passed.

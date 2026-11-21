# Safe dummy data seeder

This seeder uses the existing PostgreSQL schema. It does not truncate tables,
drop tables, call application APIs, send notifications, or make real payments.

## 1. Preview locally

From the repository root:

```bash
npm run seed:dummy --workspace backend
```

The default operation is a dry run and does not open a database connection.

## 2. Seed a local database

Set `DATABASE_URL` in the shell or in `backend/.env`, then explicitly confirm:

```bash
SEED_TARGET=local \
SEED_CONFIRM=SEED_HALO_DUMMY_DATA \
npm run seed:dummy --workspace backend -- --write
```

Optional counts:

```bash
SEED_SALONS=3 SEED_CUSTOMERS=25 SEED_APPOINTMENTS=50 \
SEED_REVIEWS=20 SEED_NOTIFICATIONS=20 SEED_PAYMENTS=20 \
SEED_CONFIRM=SEED_HALO_DUMMY_DATA \
npm run seed:dummy --workspace backend -- --write
```

The default test password for generated accounts is `HaloTest@2026`. Set
`SEED_PASSWORD` before seeding if you want another password. Do not reuse it in
production.

The seeded salon, service, product, stylist, and banner records include public
demo image URLs so the web and mobile discovery/detail cards render images.
They are external demo assets, not uploaded to Render storage. Replace the
image constants in the script with your Cloudinary URLs for a fully controlled
staging environment. AI history records remain metadata-only because the
private `/media/:id` endpoint requires an authenticated stored asset; upload a
real image through the application before testing private AI media flows.

## 3. Render staging

Use Render's **external** PostgreSQL connection URL when running from your
computer. Do not paste the URL into source control or chat. Render's dashboard
shows it under **Connect → External**, and the Render CLI is documented at
<https://render.com/docs/cli>.

```bash
export DATABASE_URL='postgresql://...'
SEED_TARGET=render-staging \
SEED_CONFIRM=SEED_HALO_DUMMY_DATA \
SEED_CONFIRM_TARGET=RENDER_STAGING \
npm run seed:dummy --workspace backend -- --write
```

The script refuses `render-staging` without both confirmations and refuses
`NODE_ENV=production` unless an explicit production override is supplied. Use
a separate staging database for testing.

## 4. Verify the generated data

Run these read-only queries using Render's SQL client or `psql`:

```sql
SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role;
SELECT COUNT(*) FROM salons WHERE "tenantCode" LIKE 'seed-hyd-%';
SELECT status, COUNT(*) FROM appointments a
JOIN salons s ON s.id = a."salonId"
WHERE s."tenantCode" LIKE 'seed-hyd-%' GROUP BY status ORDER BY status;
SELECT status, COUNT(*) FROM reviews r
JOIN salons s ON s.id = r."salonId"
WHERE s."tenantCode" LIKE 'seed-hyd-%' GROUP BY status ORDER BY status;
SELECT status, COUNT(*) FROM payments p
JOIN salons s ON s.id = p."salonId"
WHERE s."tenantCode" LIKE 'seed-hyd-%' GROUP BY status ORDER BY status;
SELECT channel, status, COUNT(*) FROM notifications n
JOIN salons s ON s.id = n."salonId"
WHERE s."tenantCode" LIKE 'seed-hyd-%' GROUP BY channel, status ORDER BY channel, status;
SELECT COUNT(*) AS orphaned_appointments
FROM appointments a LEFT JOIN salons s ON s.id = a."salonId"
WHERE a."salonId" IS NOT NULL AND s.id IS NULL;
```

## 5. Remove only generated data

This is the only cleanup command. It targets generated tenant codes, generated
emails, `SEED-*` coupons/referrals, and their dependent records. It runs in one
transaction and is never enabled by default:

```bash
SEED_TARGET=local \
SEED_CONFIRM=SEED_HALO_DUMMY_DATA \
npm run seed:dummy --workspace backend -- --write --cleanup
```

For Render staging, also set `SEED_CONFIRM_TARGET=RENDER_STAGING`. Review the
printed deletion counts before using this against any shared database.

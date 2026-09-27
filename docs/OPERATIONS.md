# Halo Operations Guide

## Free testing deployment

1. Create a Supabase PostgreSQL project and copy its `DATABASE_URL`.
2. Apply migrations by starting the backend once with `DATABASE_URL` configured. The app runs TypeORM migrations at startup.
3. Deploy `backend` to a Node-compatible service such as Render or Railway's available free/testing tier. Set `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `ADMIN_INVITE_CODE`, `CORS_ORIGINS`, and `FRONTEND_URL` in the host dashboard.
4. Deploy `frontend` as a static Vite site on Cloudflare Pages. Set `VITE_API_URL` to the HTTPS backend URL.
5. Use the hosting provider's HTTPS URL for testing. A custom domain is optional.
6. Keep `PAYMENTS_ENABLED=false` and `WHATSAPP_ENABLED=false` until provider credentials are configured.

## Backups and restore

Run `DATABASE_URL='...' ./scripts/backup-db.sh` from a machine with `pg_dump` installed. Restore only into a test database first with `DATABASE_URL='...' ./scripts/restore-db.sh backups/file.dump`. Backup files are ignored by Git.

## Rollback

Tag releases with `git tag v0.1.0 && git push origin v0.1.0`. To roll back, deploy the last known-good tag, keep environment variables unchanged, and apply only forward-compatible migrations. Never automatically run destructive down migrations against production.

## Load and recovery tests

Run `k6 run -e API_URL=https://your-api.example.com load/health.js` only against a staging/test deployment. For recovery testing, create a temporary PostgreSQL database, restore a dump, verify `users`, `salon`, `appointments`, `reviews`, and `payments`, then delete the temporary database.

## Monitoring

Point a free uptime monitor at `GET /health`. The endpoint returns HTTP 200 only when the application can execute `SELECT 1`; database failures return HTTP 503. Request logs are JSON lines with a request ID and timing data.

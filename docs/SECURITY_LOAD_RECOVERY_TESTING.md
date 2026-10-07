# Security, load, and recovery testing

Run these checks against local or staging only. Set `API_URL` explicitly for staging; never run load tests against production without approval.

## Security smoke test

```bash
API_URL=http://localhost:3000 ./scripts/security-smoke.sh
```

This verifies that protected endpoints reject anonymous requests and that baseline security headers are present.

## Load test

Install [k6](https://grafana.com/docs/k6/latest/), start the API, then run:

```bash
API_URL=http://localhost:3000 k6 run load/health.js
```

Before launch, record the 95th percentile latency and error rate. Repeat with realistic appointment and authenticated traffic in staging.

## Recovery test

1. Create a backup with `scripts/backup-db.sh`.
2. Restore it into a separate recovery database with `scripts/restore-db.sh`.
3. Start the backend against the recovery database.
4. Verify `/health`, login, salon directory, appointment creation, and payment records.
5. Record restore duration and data verification results.

## Minimum release gates

- Anonymous access cannot reach protected data.
- No cross-salon records are returned for an authenticated user.
- Security smoke test passes.
- Staging load test stays below the agreed latency and error thresholds.
- A recent backup restores successfully.

# Database backup and restore

The production database must have provider-native automated backups enabled as the primary protection. The scripts in `scripts/` provide an additional logical backup and a tested restore procedure.

## Create a backup

```bash
DATABASE_URL='postgres://...' BACKUP_RETENTION_DAYS=30 ./scripts/backup-db.sh
```

Store the generated `.dump` file outside the application server, encrypted and access-controlled. Do not commit it to Git.

## Restore a backup

Restore into a separate recovery database first:

```bash
DATABASE_URL='postgres://recovery-database' CONFIRM_RESTORE=YES ./scripts/restore-db.sh ./backups/halo-20261007T120000Z.dump
```

Verify `/health`, login, appointments, and payments in the recovery environment before any production restore. A production restore requires a maintenance window and a fresh backup of the current database.

## Operating policy

- Keep daily backups for 30 days and provider point-in-time recovery where available.
- Test a restore at least monthly and record the restore duration and result.
- Restrict backup access to the deployment/database operators.
- Never place `DATABASE_URL`, backup files, or credentials in the repository.

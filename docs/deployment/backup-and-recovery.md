# Backup and recovery runbook

Cloud SQL remains private-IP only. This document is a runbook, not proof that
backups, point-in-time recovery, or a restore drill have already been enabled.

## Read-only configuration evidence

On 2026-11-11, a read-only instance inspection confirmed that automated
backups are enabled, seven backups are retained, point-in-time recovery is
enabled, transaction logs are archived to Cloud Storage, and logs retain for
seven days. This verifies configuration only; it does not verify that a
restore succeeds. See `docs/deployment/cloud-operations-evidence.md`.

## Before relying on recovery

- Obtain administrator approval for a read-only Cloud SQL configuration check.
- Record automated-backup retention, point-in-time-recovery status and the
  latest successful backup in the project evidence.
- Create a separate non-production restore target. Never restore over the
  production instance.
- Restore one approved backup into that target, run Prisma migration-status
  and read-only health checks, then record the result and delete only the
  temporary target if approved.

## Schema drift check

`npm run verify:schema:readonly` runs no DDL and no data changes. It requires
`ALLOW_READ_ONLY_SCHEMA_CHECK=true` because it may connect to an environment
outside the developer machine. It reports only migration count and whether the
`academic_event_outbox` table is present; it never prints credentials.

# Cloud operations evidence

Read-only inspection date: 2026-11-11. No Cloud SQL, IAM, scheduler, Cloud Run
or production database change was made while collecting this evidence.

| Item | Status | Evidence |
|---|---|---|
| Cloud SQL instance | VERIFIED | `nova-university-prod` is in `us-central1`. |
| Network exposure | VERIFIED | The instance reported private address `172.31.0.4`; no public IP was reported. |
| High availability | VERIFIED | Cloud SQL reports `REGIONAL` availability. |
| Automated backups | VERIFIED | Backups are enabled with a 03:00 start time and seven retained backups. |
| Point-in-time recovery | VERIFIED | Point-in-time recovery and transaction-log archiving are enabled; transaction logs retain for seven days. |
| Database secret | VERIFIED | Secret Manager contains `NOVA_DATABASE_URL`; its value was not read or printed. |
| App Hosting private egress | CONFIGURED | `apphosting.yaml` specifies `PRIVATE_RANGES_ONLY` egress via the default VPC/subnet. Runtime confirmation needs an approved service inspection. |
| App Hosting backend | VERIFIED | The existing backend is reachable through its Cloud Run-managed URL and reported Ready. |
| Dedicated event worker | MISSING | No separate Cloud Run service was listed in `us-central1` during this read-only inspection. |
| Cloud Scheduler trigger | MISSING | No Scheduler job was listed in `us-central1` during this read-only inspection. |
| Outbox schema in production | NOT VERIFIED | The database has private IP and direct schema access was not attempted. Run the approved read-only schema check from a VPC-connected runtime. |
| Restore drill | NOT VERIFIED | No restore was performed. A restore test must use a separate non-production instance. |
| Monitoring and alerts | NOT VERIFIED | Alert policy and log-based metric review was not completed in this inspection. |

## Safe next steps requiring production approval

1. Run `npm run verify:schema:readonly` from an approved VPC-connected runtime
   with `ALLOW_READ_ONLY_SCHEMA_CHECK=true`.
2. Deploy the reviewed Cloud Run worker template using a dedicated service
   account, then create the authenticated Scheduler trigger.
3. Restore one approved backup to a separately named non-production instance
   and run only read-only integrity checks against it.
4. Record alert policies for worker failures and dead-letter event count.

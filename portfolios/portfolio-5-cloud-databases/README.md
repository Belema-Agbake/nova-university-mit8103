# Portfolio 5 — Distributed and Cloud Databases

## Purpose

Nova University runs its official PostgreSQL academic database on Google Cloud
SQL in `us-central1`. The production database is private: it has no public
database endpoint and is reached by application services through the VPC.

## Cloud architecture

```text
Browser
  → Firebase App Hosting / Next.js portal
  → private VPC egress
  → Cloud SQL for PostgreSQL

PostgreSQL academic_event_outbox
  → IAM-protected Cloud Run worker
  → Cloud Firestore notifications and activity feed

Cloud Scheduler
  → authenticated OIDC request every minute
  → Cloud Run worker
```

## Relevant implementation and configuration

| Concern | Source |
| --- | --- |
| App Hosting runtime, Secret Manager and private VPC configuration | [`apphosting.yaml`](../../apphosting.yaml) |
| Worker-only batch route | [`src/app/api/v1/internal/academic-events/process/route.ts`](../../src/app/api/v1/internal/academic-events/process/route.ts) |
| Worker batch entry point | [`src/server/jobs/process-academic-events.ts`](../../src/server/jobs/process-academic-events.ts) |
| Cloud Run service template | [`infra/cloud-run/academic-event-worker.yaml`](../../infra/cloud-run/academic-event-worker.yaml) |
| Worker container definition | [`infra/cloud-run/Dockerfile.academic-event-worker`](../../infra/cloud-run/Dockerfile.academic-event-worker) |
| Cloud Build definition | [`infra/cloud-run/cloudbuild.academic-event-worker.yaml`](../../infra/cloud-run/cloudbuild.academic-event-worker.yaml) |
| Scheduler template | [`infra/scheduler/academic-event-worker.yaml`](../../infra/scheduler/academic-event-worker.yaml) |
| Read-only schema verification | [`scripts/verify-production-schema.ts`](../../scripts/verify-production-schema.ts) |

## Operational controls

- Cloud SQL is in `us-central1` with private networking and high availability.
- Automated backups, point-in-time recovery and seven-day backup retention are
  enabled.
- The non-production instance `nova-university-restore-20261112` was restored
  from a production backup and reached the `RUNNABLE` state.
- The dedicated Cloud Run worker `nova-academic-event-worker` uses a dedicated
  service account, private-ranges-only VPC egress, Secret Manager database
  access and Firestore permissions.
- Unauthenticated access to the worker is disabled.
- The `nova-academic-event-worker-minute` Cloud Scheduler job is enabled and
  calls the worker every minute with an OIDC identity.

## Evidence still to capture

The worker and Scheduler are deployed. Add screenshots of the following to
the final submission:

1. Cloud SQL private-IP, high-availability, backup and PITR settings.
2. The recovery instance in `RUNNABLE` state.
3. Cloud Run service configuration and deployed revision.
4. Cloud Scheduler job configuration.
5. A successful Scheduler-to-worker Cloud Run request log.

## Cloud design decision

Private networking prevents public PostgreSQL access. Secret Manager keeps the
database connection out of source control. The worker is separated from the
portal so notification delivery can be retried independently of student and
lecturer web requests.

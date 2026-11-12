# Production cloud preparation

Nova keeps PostgreSQL as the authoritative store for users, registrations,
scores, results, transcripts and academic history. Firebase Authentication is
used only for identity; Firebase passwords never enter PostgreSQL.

## Planned architecture

- Firebase App Hosting: Next.js UI and route handlers.
- Firebase Authentication: email/password identity and ID tokens.
- Cloud SQL for PostgreSQL: Prisma-managed academic database.
- Firestore: only approved auxiliary, non-authoritative documents.
- Cloud Storage: controlled file uploads such as lecturer spreadsheets.
- Cloud Run plus Cloud Scheduler: durable registration/result workers.
- Secret Manager: database URLs, Admin SDK credentials and worker secrets.

Production variables are server-only unless prefixed `NEXT_PUBLIC_`. Cloud SQL
uses a private connection or Cloud SQL connector; Prisma migrations run as a
controlled release step with `prisma migrate deploy`, never `migrate reset`.

Backups should use Cloud SQL automated backups and point-in-time recovery. Logs
should include request IDs, role decisions and worker outcomes without tokens,
passwords or student result payloads. Deployments require a staging migration
check, smoke tests, rollback plan and explicit approval. This document prepares
the architecture only; no cloud resources have been created or deployed.

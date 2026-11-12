# Improvement changelog

## Reliable academic-event delivery

**Change:** Added processing leases, capped exponential retry, a dead-letter
status and an explicit local migration for the PostgreSQL academic-event
outbox.

**Why:** The previous worker could leave an event in `PROCESSING` after a
crash, retried all failures after the same delay, and silently ignored a
missing outbox table.

**Files:** `prisma/schema.prisma`,
`prisma/migrations/20261111190000_outbox_delivery_reliability/migration.sql`,
`src/server/notifications/academic-event-service.ts`.

**Explanation:** A worker claims a row, stores a five-minute lease, delivers
two idempotent Firestore documents, then marks the row `PROCESSED`. Expired
leases return to `FAILED`; after five delivery attempts, an event becomes
`DEAD_LETTER` for visible follow-up.

**Database:** `academic_event_outbox` gains lease/attempt timestamps and an
index for expired-work recovery.

**Testing:** Type checking/build and relevant local tests must be run after
Prisma client generation. No production migration or worker deployment has
occurred.

**Assignment:** NoSQL integration, transaction design, cloud-worker evidence.

**UI impact:** None; existing pages, routes and layout are unchanged.

## Measurable SQL and cloud-operation evidence

**Change:** Added guarded local-only SQL benchmark and large synthetic data
generator, read-only schema verification, Cloud Run/Scheduler templates and
backup/restore documentation.

**Why:** Existing SQL evidence used only three students and cloud operational
claims were not reproducible.

**Files:** `scripts/benchmark-sql.ts`,
`scripts/verify-production-schema.ts`,
`portfolios/portfolio-2-sql-optimisation/seed-large-dataset.ts`, `infra/`,
and `docs/database` / `docs/deployment`.

**Testing:** The scripts reject remote/non-isolated database targets. The cloud
templates are intentionally not deployed.

**Assignment:** SQL optimisation and cloud database evidence.

**UI impact:** None.

## Disposable local database test environment

**Change:** Moved the database integration suite to the dedicated local
`nova_university_test_isolated` database and added a guarded preparation
runner.

**Why:** The former test database contained unrelated local records, causing
fixture assertions to fail and making test outcomes unreliable.

**Files:** `scripts/run-isolated-db-tests.ts`, `package.json`, and the three
database test files.

**Explanation:** The runner derives the isolated database URL from local test
configuration, rejects remote hosts, applies migrations, seeds deterministic
fixtures, and then runs the database tests. It never resets the original
`nova_university_test` database.

**Database:** Only the disposable `nova_university_test_isolated` database is
migrated and seeded.

**Testing:** `npm run test:db:isolated` completed with 15 passing tests and 0
failures on 2026-11-11.

**Assignment:** Database integrity, migration evidence, automated testing.

**UI impact:** None.

## Cloud SQL configuration evidence

**Change:** Captured read-only Cloud SQL and supporting service configuration
evidence.

**Why:** The earlier audit lacked verified backup, point-in-time recovery and
private-networking evidence.

**Files:** `docs/deployment/cloud-operations-evidence.md` and
`docs/deployment/backup-and-recovery.md`.

**Testing:** Read-only Google Cloud inspection confirmed the instance is
private-IP, regional, backed up, and configured for point-in-time recovery.
No restore, migration, worker deployment, Scheduler creation or IAM change was
performed.

**Assignment:** Distributed and cloud database exercise.

**UI impact:** None.

## Backend and database structure evidence

**Change:** Added an explicit backend-boundary guide and a PostgreSQL data
dictionary.

**Why:** The source had useful modules but lacked one concise explanation of
which layer owns authentication, authorization, transactions, notifications
and database access.

**Files:** `docs/architecture/backend-boundaries.md`,
`docs/database/data-dictionary.md`, and `docs/CODEBASE_EXPLAINED.md`.

**Explanation:** The guides map each real server directory to one
responsibility and make the transaction boundaries, source-of-truth rules and
table relationships easy to explain during an assessment.

**Database:** Documentation only; no migration or data change.

**Testing:** Documentation reflects the current Prisma schema and services.

**Assignment:** Database architecture, maintainability and documentation.

**UI impact:** None.

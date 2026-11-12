# Nova University codebase explained

## How the application works

Nova University is a Next.js App Router application. Pages in `src/app/` form
the user interface and API routes. Server-side services in `src/server/` hold
the business rules. PostgreSQL is the authoritative academic record; Firebase
Authentication proves who signed in, while Firestore stores disposable
notification and activity projections.

## Key modules

| File | Purpose | Main dependencies | How to explain it in a defence |
|---|---|---|---|
| `prisma/schema.prisma` | Defines the relational data model. | PostgreSQL, Prisma | “The schema separates people, academic structure, registration, assessment and results to avoid repeating facts.” |
| `src/server/database/prisma.ts` | Shares a server-only Prisma client. | Prisma | “It prevents connection churn during development and never reaches the browser.” |
| `src/server/registration/registration-service.ts` | Registers a student safely. | Prisma transaction, PostgreSQL locks | “A serializable transaction locks the offering before capacity is checked, preventing oversubscription.” |
| `src/server/grading/lecturer-grading-service.ts` | Saves scores and submits results. | Prisma, role checks | “Lecturers can write only their assigned offerings; scores and result state are updated together.” |
| `src/server/grading/administrator-review-service.ts` | Approves/publishes results and writes audits. | Prisma, outbox | “Approval is auditable and publication creates a notification event in the same transaction.” |
| `src/server/notifications/academic-event-service.ts` | Delivers Firestore notification projections. | PostgreSQL outbox, Firebase Admin | “Delivery is retried and idempotent; PostgreSQL remains the official record.” |

## Prisma and PostgreSQL

Prisma maps TypeScript operations to parameterized PostgreSQL queries. The
models use primary keys, foreign keys and compound unique keys to protect
relationships. Examples include one registration per student/offering and one
lecturer assignment per lecturer/offering.

The migrations in `prisma/migrations/` are the history of database structure.
They must be applied to each environment deliberately; an application should
not hide a missing migration. `scripts/verify-production-schema.ts` is
read-only and can be used after approval to detect migration/outbox drift.

For the complete table-by-table explanation, see
`docs/database/data-dictionary.md`. For the responsibility of each server
module and transaction boundary, see `docs/architecture/backend-boundaries.md`.

## Authentication and permissions

Firebase Authentication supplies a signed Firebase UID. Server code verifies
that UID and resolves it to `users.firebaseUid`. The linked PostgreSQL user
role controls student, lecturer and administrator actions. A lecturer
assignment is checked before a lecturer can view a roster or save a grade.

## Transactions and concurrency

Registration runs inside a serializable transaction and locks the relevant
offering. This makes the capacity check and registration insert one atomic
operation. If two people try to take the final space, only one can commit.

## Firestore and the transactional outbox

When an academic action needs a notification, the transaction writes an
`academic_event_outbox` record. A worker claims available events with a lease,
writes Firestore documents named after the stable event ID, and marks delivery
complete only after both notification and activity documents succeed. Failed
events back off exponentially. After five failed attempts they move to
`DEAD_LETTER` for administrator investigation. If a worker crashes, the lease
expires and a later worker retries it.

## SQL optimisation

The portfolio contains baseline queries and candidate indexes. Performance is
measured with `EXPLAIN (ANALYZE, BUFFERS)` on an isolated local database, not
production. `seed-large-dataset.ts` generates the required 10,000 synthetic
students and registrations. An index is retained only if the measured plan or
an integrity/access requirement supports it.

## Cloud SQL and recovery

`apphosting.yaml` uses a Secret Manager database URL and private-ranges-only
VPC egress. Cloud SQL is not public. The deployment templates under `infra/`
describe a separate worker and scheduler but have not been applied. The backup
and recovery runbook describes how to verify backups and restore into a
separate non-production database; it does not claim a restore was performed.

## Testing

- `npm run test:db` tests relational constraints against local
  `nova_university_test` only.
- `npm run test:auth` and `npm run test:firestore` use Firebase emulators.
- `npm run build` checks the production Next.js build.
- `npm run benchmark:sql` is local-only and requires a dedicated benchmark DB.

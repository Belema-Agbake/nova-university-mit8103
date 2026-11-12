# Portfolio 4 — NoSQL and Advanced Data Models

## Purpose

Nova University uses PostgreSQL as the authoritative academic-record database
and Cloud Firestore as a separate, user-facing notification and activity
projection. This avoids duplicating official grades or registrations in NoSQL
while allowing each authenticated user to read their own notification feed.

## Data model and delivery flow

```text
Academic change
  → PostgreSQL transaction
  → academic_event_outbox durable event
  → Cloud Run outbox worker
  → Firestore notification and activity documents
  → authorised recipient
```

The `academic_event_outbox` table is created in the same PostgreSQL transaction
as the academic action. A worker claims events with a processing lease, writes
idempotent Firestore documents using the stable outbox event ID, and records
the outcome back in PostgreSQL.

## Relevant implementation

| Concern | Source |
| --- | --- |
| Outbox model and recovery fields | [`prisma/schema.prisma`](../../prisma/schema.prisma) and [`prisma/migrations/20261111190000_outbox_delivery_reliability/migration.sql`](../../prisma/migrations/20261111190000_outbox_delivery_reliability/migration.sql) |
| Delivery, retry, lease and dead-letter logic | [`src/server/notifications/academic-event-service.ts`](../../src/server/notifications/academic-event-service.ts) |
| Firestore security policy | [`firestore.rules`](../../firestore.rules) |
| Client notification APIs | [`src/app/api/v1/notifications`](../../src/app/api/v1/notifications) and [`src/app/api/v1/activity`](../../src/app/api/v1/activity) |
| Firestore access tests | [`tests/firestore/notifications.rules.test.ts`](../../tests/firestore/notifications.rules.test.ts) |
| Outbox reliability tests | [`tests/outbox/academic-event-outbox.test.ts`](../../tests/outbox/academic-event-outbox.test.ts) |

## Reliability controls

- Firestore document IDs equal the outbox event ID, so retrying a delivery does
  not create duplicate notifications.
- A processing lease protects against a worker crash leaving an event locked.
- Exponential backoff delays retry after transient failure.
- Five failed delivery attempts move the event to `DEAD_LETTER` for review.
- Atomic PostgreSQL updates ensure two workers cannot claim the same event.

## Verified evidence

Run the full local reliability suite with:

```powershell
npm run test:outbox
```

The current suite passes five Firestore Emulator-backed scenarios:

1. Notification and activity delivery.
2. Retry after a transient delivery failure.
3. Dead-letter status after five failed attempts.
4. Expired lease recovery.
5. Concurrent workers claiming an event at most once.

The Firestore security suite is run separately with:

```powershell
npm run test:firestore
```

## Design decision

PostgreSQL remains the single source of truth because academic records require
strong relational integrity, transactions and immutable published results.
Firestore is suitable for per-user notification and activity feeds because it
provides low-latency document reads and is protected by recipient-based rules.

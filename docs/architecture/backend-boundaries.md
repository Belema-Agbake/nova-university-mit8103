# Backend boundaries

This document records the existing server-side boundaries. It does not change
routes, database data, user interfaces, or public API contracts.

## Request flow

```text
Next.js page / API route
        -> authentication and authorization guard
        -> focused domain service
        -> Prisma transaction or read query
        -> PostgreSQL (authoritative academic record)
        -> transactional outbox (when a notification is needed)
        -> Firestore projection worker
```

## Module ownership

| Boundary | Modules | Responsibility | Must not do |
|---|---|---|---|
| Authentication | `src/server/authentication` | Verify Firebase tokens and initialise Admin SDK. | Make academic decisions. |
| Authorization | `src/server/authorization` | Resolve an active Nova user, student, or lecturer identity. | Write grades or registrations. |
| Registration | `src/server/registration` | Availability checks, locking, registration and drop workflow. | Trust client capacity values. |
| Grading | `src/server/grading` | Lecturer scoring, upload validation, administrator review and publication. | Allow a lecturer outside their assigned offering. |
| Notifications | `src/server/notifications` | Create durable events and deliver idempotent Firestore projections. | Treat Firestore as the result system of record. |
| Database | `src/server/database` | Own the server-only Prisma client. | Expose database credentials to the browser. |
| HTTP | `src/app/api` and `src/server/http` | Convert requests to validated domain-service calls and return responses. | Duplicate academic business rules. |

## Transaction boundaries

- Registration: capacity, prerequisite, timetable and registration writes are
  one serializable PostgreSQL transaction.
- Grade save/submission: validated score upserts, calculated result and audit
  entry are one transaction.
- Result review/publication: status update, audit entry and outbox event are
  one transaction.
- Notification delivery: Firestore is asynchronous and retried. A successful
  Firestore write never changes an official academic result.

## Error ownership

`ApplicationError` is the common domain error type. Services provide a stable
code and user-safe message; API routes map those errors to HTTP responses.
Infrastructure errors such as a missing migration are intentionally not
silenced because they require operator action.

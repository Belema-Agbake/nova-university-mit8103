# Course registration architecture

## Authentication and ownership

Every registration endpoint requires a Firebase ID token in the `Authorization: Bearer <token>` header. The server verifies the token with Firebase Admin, requires a verified email address, and resolves the token `uid` to `users.firebaseUid`. The linked user must have the `STUDENT` role and exactly one `students` record. Browser-provided student IDs, programme IDs, levels, units, and eligibility fields are ignored.

For local Auth Emulator work, set `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`. The Admin SDK then verifies emulator tokens. Seeded Firebase UIDs are examples only; a registrar must link each emulator or production account to its PostgreSQL user record before access is granted.

## Endpoints

- `GET /api/v1/registrations` — authenticated student registration summary.
- `GET /api/v1/registrations/available?semesterId=<id>&level=<100..500>` — eligible and ineligible programme offerings, with reasons.
- `POST /api/v1/registrations` — submit `{ semesterId, courseOfferingIds }` atomically.
- `DELETE /api/v1/registrations/<registrationId>` — mark an eligible registration as `DROPPED`.
- `GET /api/v1/registrations/timetable` — schedules derived from the student’s active registrations.

Malformed inputs return 400, missing/invalid tokens return 401, and correctly authenticated users without an authorised student mapping return 403.

## Registration rules

The service checks the current registration period, programme ownership, official academic level, prerequisite results, current capacity, existing registrations, configured core requirements, and timetable conflicts. Core/elective classification comes from `programme_course_requirements`; no browser course list is authoritative. Credit limits are intentionally not enforced because no configured policy field currently exists in the schema.

## Transaction and concurrency strategy

Registration submissions use a PostgreSQL `SERIALIZABLE` Prisma transaction. The requested `course_offerings` are locked with `SELECT … FOR UPDATE`, then capacity and eligibility are rechecked before a batch insert. The `registrations(studentId, courseOfferingId)` unique constraint remains the final duplicate defence. Failure anywhere rolls back the complete batch. A caller receiving a serialization failure should retry the request; the frontend displays the returned error and does not claim success.

Registrations are created as `PENDING`, because the current product workflow requires adviser approval. Drops are status transitions rather than deletes and are rejected once the protected result workflow is under way.

## Current policy gaps

Academic minimum/maximum unit policy and adviser approval configuration have no dedicated schema configuration yet. The implementation therefore applies only stored rules and uses the safe `PENDING` status. Registrars must set `students.officialLevel` and link `users.firebaseUid` before students can register.

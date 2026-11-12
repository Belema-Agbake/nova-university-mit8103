-- Make notification delivery recoverable after a worker crash. PostgreSQL stays
-- authoritative; Firestore receives an idempotent projection keyed by event ID.
ALTER TYPE "AcademicEventStatus" ADD VALUE IF NOT EXISTS 'DEAD_LETTER';

ALTER TABLE "academic_event_outbox"
  ADD COLUMN IF NOT EXISTS "processingLeaseUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "academic_event_outbox_status_processingLeaseUntil_idx"
  ON "academic_event_outbox" ("status", "processingLeaseUntil");

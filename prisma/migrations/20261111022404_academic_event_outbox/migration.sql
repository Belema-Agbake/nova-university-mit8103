-- CreateEnum
CREATE TYPE "AcademicEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "academic_event_outbox" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "recipientFirebaseUid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "status" "AcademicEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_event_outbox_eventKey_key" ON "academic_event_outbox"("eventKey");

-- CreateIndex
CREATE INDEX "academic_event_outbox_status_availableAt_createdAt_idx" ON "academic_event_outbox"("status", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "academic_event_outbox_recipientFirebaseUid_createdAt_idx" ON "academic_event_outbox"("recipientFirebaseUid", "createdAt");

-- Result publication creates a durable, idempotent notification event without
-- moving the official result out of PostgreSQL.
CREATE OR REPLACE FUNCTION enqueue_published_result_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PUBLISHED'::"ResultStatus" AND (TG_OP = 'INSERT' OR OLD.status <> 'PUBLISHED'::"ResultStatus") THEN
    INSERT INTO "academic_event_outbox" (
      "id", "eventKey", "eventType", "recipientFirebaseUid", "title", "message",
      "payload", "status", "attempts", "availableAt", "createdAt", "updatedAt"
    )
    SELECT
      'result-' || NEW.id || '-published',
      'result:' || NEW.id || ':published',
      'RESULT_PUBLISHED',
      u."firebaseUid",
      'Result published',
      c.code || ' result is now available.',
      jsonb_build_object('resultId', NEW.id, 'courseCode', c.code),
      'PENDING'::"AcademicEventStatus", 0, NOW(), NOW(), NOW()
    FROM "registrations" r
    JOIN "students" s ON s.id = r."studentId"
    JOIN "users" u ON u.id = s."userId"
    JOIN "course_offerings" co ON co.id = r."courseOfferingId"
    JOIN "courses" c ON c.id = co."courseId"
    WHERE r.id = NEW."registrationId" AND u."firebaseUid" IS NOT NULL
    ON CONFLICT ("eventKey") DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER results_enqueue_published_event
AFTER INSERT OR UPDATE OF status ON "results"
FOR EACH ROW EXECUTE FUNCTION enqueue_published_result_event();

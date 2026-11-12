-- Test-database-only benchmark improvements. These are candidates for a
-- reviewed Prisma migration after larger-data validation; this file is not
-- applied to production.
CREATE INDEX IF NOT EXISTS benchmark_registrations_student_status_offering_idx
  ON registrations ("studentId", status, "courseOfferingId");

CREATE INDEX IF NOT EXISTS benchmark_results_status_submitted_id_idx
  ON results (status, "submittedAt", id)
  INCLUDE ("registrationId");

ANALYZE;

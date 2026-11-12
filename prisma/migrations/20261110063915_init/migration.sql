-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'LECTURER', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "SemesterTerm" AS ENUM ('FIRST', 'SECOND', 'SUMMER');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'REGISTERED', 'DROPPED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADED', 'VALIDATED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'REOPENED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matriculationNumber" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "entryYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "staffNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programmes" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "award" TEXT NOT NULL,
    "durationYears" INTEGER NOT NULL,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "term" "SemesterTerm" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creditUnits" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_prerequisites" (
    "courseId" TEXT NOT NULL,
    "prerequisiteCourseId" TEXT NOT NULL,

    CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("courseId","prerequisiteCourseId")
);

-- CreateTable
CREATE TABLE "course_offerings" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "course_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturer_assignments" (
    "id" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lecturer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_schedules" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "room" TEXT NOT NULL,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_periods" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "registration_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_course_requirements" (
    "programmeId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "recommendedSemester" INTEGER,

    CONSTRAINT "programme_course_requirements_pkey" PRIMARY KEY ("programmeId","courseId")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_policies" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "programmeId" TEXT,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "grading_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_scale_entries" (
    "id" TEXT NOT NULL,
    "gradingPolicyId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minimumScore" DECIMAL(5,2) NOT NULL,
    "maximumScore" DECIMAL(5,2) NOT NULL,
    "gradePoint" DECIMAL(3,2) NOT NULL,

    CONSTRAINT "grading_scale_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_components" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightPercent" DECIMAL(5,2) NOT NULL,
    "maximumScore" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "assessment_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_scores" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "assessmentComponentId" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "totalScore" DECIMAL(5,2),
    "letterGrade" TEXT,
    "gradePoint" DECIMAL(3,2),
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_audit_history" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_audit_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_upload_batches" (
    "id" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "result_upload_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_upload_errors" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "field" TEXT,
    "message" TEXT NOT NULL,
    "rawValue" TEXT,

    CONSTRAINT "result_upload_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "students_matriculationNumber_key" ON "students"("matriculationNumber");

-- CreateIndex
CREATE INDEX "students_programmeId_idx" ON "students"("programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_userId_key" ON "lecturers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_staffNumber_key" ON "lecturers"("staffNumber");

-- CreateIndex
CREATE INDEX "lecturers_departmentId_idx" ON "lecturers"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_name_key" ON "faculties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_facultyId_idx" ON "departments"("facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_facultyId_name_key" ON "departments"("facultyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "programmes_code_key" ON "programmes"("code");

-- CreateIndex
CREATE INDEX "programmes_departmentId_idx" ON "programmes"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "programmes_departmentId_name_key" ON "programmes"("departmentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_name_key" ON "academic_sessions"("name");

-- CreateIndex
CREATE INDEX "semesters_sessionId_isCurrent_idx" ON "semesters"("sessionId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_sessionId_term_key" ON "semesters"("sessionId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_departmentId_level_idx" ON "courses"("departmentId", "level");

-- CreateIndex
CREATE INDEX "course_prerequisites_prerequisiteCourseId_idx" ON "course_prerequisites"("prerequisiteCourseId");

-- CreateIndex
CREATE INDEX "course_offerings_semesterId_programmeId_idx" ON "course_offerings"("semesterId", "programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "course_offerings_courseId_semesterId_programmeId_key" ON "course_offerings"("courseId", "semesterId", "programmeId");

-- CreateIndex
CREATE INDEX "lecturer_assignments_courseOfferingId_idx" ON "lecturer_assignments"("courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "lecturer_assignments_lecturerId_courseOfferingId_key" ON "lecturer_assignments"("lecturerId", "courseOfferingId");

-- CreateIndex
CREATE INDEX "class_schedules_courseOfferingId_weekday_idx" ON "class_schedules"("courseOfferingId", "weekday");

-- CreateIndex
CREATE INDEX "registration_periods_semesterId_isActive_idx" ON "registration_periods"("semesterId", "isActive");

-- CreateIndex
CREATE INDEX "registrations_courseOfferingId_status_idx" ON "registrations"("courseOfferingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_studentId_courseOfferingId_key" ON "registrations"("studentId", "courseOfferingId");

-- CreateIndex
CREATE INDEX "grading_policies_sessionId_isDefault_idx" ON "grading_policies"("sessionId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "grading_policies_sessionId_programmeId_name_key" ON "grading_policies"("sessionId", "programmeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "grading_scale_entries_gradingPolicyId_grade_key" ON "grading_scale_entries"("gradingPolicyId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_components_courseOfferingId_name_key" ON "assessment_components"("courseOfferingId", "name");

-- CreateIndex
CREATE INDEX "assessment_scores_assessmentComponentId_idx" ON "assessment_scores"("assessmentComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_scores_registrationId_assessmentComponentId_key" ON "assessment_scores"("registrationId", "assessmentComponentId");

-- CreateIndex
CREATE UNIQUE INDEX "results_registrationId_key" ON "results"("registrationId");

-- CreateIndex
CREATE INDEX "results_status_submittedAt_idx" ON "results"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "result_audit_history_resultId_createdAt_idx" ON "result_audit_history"("resultId", "createdAt");

-- CreateIndex
CREATE INDEX "result_upload_batches_courseOfferingId_createdAt_idx" ON "result_upload_batches"("courseOfferingId", "createdAt");

-- CreateIndex
CREATE INDEX "result_upload_errors_batchId_rowNumber_idx" ON "result_upload_errors"("batchId", "rowNumber");

-- CreateIndex
CREATE INDEX "academic_notifications_userId_isRead_createdAt_idx" ON "academic_notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "academic_settings_key_key" ON "academic_settings"("key");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturer_assignments" ADD CONSTRAINT "lecturer_assignments_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturer_assignments" ADD CONSTRAINT "lecturer_assignments_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_periods" ADD CONSTRAINT "registration_periods_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_course_requirements" ADD CONSTRAINT "programme_course_requirements_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_course_requirements" ADD CONSTRAINT "programme_course_requirements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_policies" ADD CONSTRAINT "grading_policies_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_policies" ADD CONSTRAINT "grading_policies_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grading_scale_entries" ADD CONSTRAINT "grading_scale_entries_gradingPolicyId_fkey" FOREIGN KEY ("gradingPolicyId") REFERENCES "grading_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_components" ADD CONSTRAINT "assessment_components_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_scores" ADD CONSTRAINT "assessment_scores_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_scores" ADD CONSTRAINT "assessment_scores_assessmentComponentId_fkey" FOREIGN KEY ("assessmentComponentId") REFERENCES "assessment_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_audit_history" ADD CONSTRAINT "result_audit_history_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_audit_history" ADD CONSTRAINT "result_audit_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_upload_batches" ADD CONSTRAINT "result_upload_batches_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "course_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_upload_batches" ADD CONSTRAINT "result_upload_batches_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_upload_errors" ADD CONSTRAINT "result_upload_errors_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "result_upload_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_notifications" ADD CONSTRAINT "academic_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma cannot express these PostgreSQL checks and cross-table invariants.
ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_valid_dates" CHECK ("startDate" < "endDate");
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_valid_dates" CHECK ("startDate" < "endDate");
ALTER TABLE "courses" ADD CONSTRAINT "courses_valid_credit_units" CHECK ("creditUnits" > 0 AND "creditUnits" <= 12);
ALTER TABLE "courses" ADD CONSTRAINT "courses_valid_level" CHECK ("level" BETWEEN 100 AND 900);
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_valid_duration" CHECK ("durationYears" BETWEEN 1 AND 10);
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_not_self" CHECK ("courseId" <> "prerequisiteCourseId");
ALTER TABLE "course_offerings" ADD CONSTRAINT "course_offerings_valid_capacity" CHECK ("capacity" > 0);
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_valid_weekday" CHECK ("weekday" BETWEEN 1 AND 7);
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_valid_time_range" CHECK ("startTime" < "endTime");
ALTER TABLE "registration_periods" ADD CONSTRAINT "registration_periods_valid_window" CHECK ("opensAt" < "closesAt");
ALTER TABLE "grading_scale_entries" ADD CONSTRAINT "grading_scale_entries_valid_range" CHECK ("minimumScore" >= 0 AND "maximumScore" <= 100 AND "minimumScore" <= "maximumScore" AND "gradePoint" BETWEEN 0 AND 5);
ALTER TABLE "assessment_components" ADD CONSTRAINT "assessment_components_valid_weight" CHECK ("weightPercent" > 0 AND "weightPercent" <= 100);
ALTER TABLE "assessment_components" ADD CONSTRAINT "assessment_components_valid_maximum" CHECK ("maximumScore" > 0);
ALTER TABLE "assessment_scores" ADD CONSTRAINT "assessment_scores_non_negative" CHECK ("score" >= 0);
ALTER TABLE "results" ADD CONSTRAINT "results_valid_total" CHECK ("totalScore" IS NULL OR "totalScore" BETWEEN 0 AND 100);
ALTER TABLE "results" ADD CONSTRAINT "results_valid_grade_point" CHECK ("gradePoint" IS NULL OR "gradePoint" BETWEEN 0 AND 5);

-- Only one configured current semester exists at a time for a single tenant database.
CREATE UNIQUE INDEX "semesters_one_current_key" ON "semesters" ("isCurrent") WHERE "isCurrent";
-- PostgreSQL considers NULL values distinct in a normal unique index; this closes that gap for global policies.
CREATE UNIQUE INDEX "grading_policies_global_name_key" ON "grading_policies" ("sessionId", "name") WHERE "programmeId" IS NULL;

CREATE OR REPLACE FUNCTION validate_semester_within_session()
RETURNS TRIGGER AS $$
DECLARE
  session_start DATE;
  session_end DATE;
BEGIN
  SELECT "startDate", "endDate" INTO session_start, session_end
  FROM "academic_sessions" WHERE "id" = NEW."sessionId";
  IF NEW."startDate" < session_start OR NEW."endDate" > session_end THEN
    RAISE EXCEPTION 'Semester dates must fall inside the academic session dates';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER semesters_within_session
BEFORE INSERT OR UPDATE OF "sessionId", "startDate", "endDate" ON "semesters"
FOR EACH ROW EXECUTE FUNCTION validate_semester_within_session();

CREATE OR REPLACE FUNCTION validate_assessment_score_scope()
RETURNS TRIGGER AS $$
DECLARE
  registration_offering TEXT;
  component_offering TEXT;
  component_maximum NUMERIC(5,2);
BEGIN
  SELECT "courseOfferingId" INTO registration_offering FROM "registrations" WHERE "id" = NEW."registrationId";
  SELECT "courseOfferingId", "maximumScore" INTO component_offering, component_maximum FROM "assessment_components" WHERE "id" = NEW."assessmentComponentId";
  IF registration_offering IS NULL OR component_offering IS NULL OR registration_offering <> component_offering THEN
    RAISE EXCEPTION 'An assessment score must use a component from the registered course offering';
  END IF;
  IF NEW."score" > component_maximum THEN
    RAISE EXCEPTION 'Assessment score cannot exceed the component maximum';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessment_scores_validate_scope
BEFORE INSERT OR UPDATE OF "registrationId", "assessmentComponentId", "score" ON "assessment_scores"
FOR EACH ROW EXECUTE FUNCTION validate_assessment_score_scope();

CREATE OR REPLACE FUNCTION validate_final_result()
RETURNS TRIGGER AS $$
DECLARE
  offering_id TEXT;
  total_weight NUMERIC(7,2);
  component_count INTEGER;
  score_count INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD."status" = 'PUBLISHED' THEN
    RAISE EXCEPTION 'Published results are immutable; create an audited reopening workflow instead';
  END IF;
  IF NEW."status" = 'PUBLISHED' THEN
    SELECT "courseOfferingId" INTO offering_id FROM "registrations" WHERE "id" = NEW."registrationId";
    SELECT COALESCE(SUM("weightPercent"), 0), COUNT(*) INTO total_weight, component_count FROM "assessment_components" WHERE "courseOfferingId" = offering_id;
    SELECT COUNT(*) INTO score_count FROM "assessment_scores" WHERE "registrationId" = NEW."registrationId";
    IF total_weight <> 100 OR component_count = 0 THEN
      RAISE EXCEPTION 'A result cannot be published until assessment weights total exactly 100%%';
    END IF;
    IF score_count <> component_count THEN
      RAISE EXCEPTION 'A result cannot be published until every assessment component has a score';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER results_validate_finalisation
BEFORE INSERT OR UPDATE ON "results"
FOR EACH ROW EXECUTE FUNCTION validate_final_result();

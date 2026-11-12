# Nova University — MIT 8103 Evidence-Based Audit

Audit date: 2026-11-11. This was a read-only source, migration, portfolio, configuration and test-suite review. No production database, Firebase, Google Cloud resource, deployment, user or application code was changed by this audit. The official MIT 8103 marking document was **not found** in the repository; scores use the provisional 40-mark framework supplied for this audit.

## Executive summary

Nova University has a credible PostgreSQL/Prisma core and unusually strong transaction/concurrency evidence for a student project. Since the previous audit, lecturer grade entry, spreadsheet upload, approval/publication routes, transcript download and Firebase/App Hosting/Cloud SQL configuration have been added. The largest remaining assignment weaknesses are measured SQL performance at realistic scale, verified Firestore worker operation, production migration drift, end-to-end role testing, and missing complete academic administration workflows.

## Requirements traceability

| Requirement | Status | Evidence / finding |
|---|---|---|
| Normalized relational university schema | Partial to strong | `prisma/schema.prisma`, `docs/database/relationships.md`, DBML portfolio. Models separate identity, academic structure, delivery, registration, assessment, results, uploads and audits. |
| PK/FK/unique/index constraints | Strong | Prisma keys/indexes plus `prisma/migrations/*/migration.sql`; published-result and score-scope triggers exist. |
| SQL optimisation evidence | Partial | `portfolios/portfolio-2-sql-optimisation/*` has EXPLAIN evidence, but dataset is small and no production-scale before/after benchmark is supplied. |
| ACID/concurrency | Strong | `src/server/registration/registration-service.ts:92-114` uses serializable transaction and `FOR UPDATE`; portfolio 3 documents retries/seat tests. |
| NoSQL integration | Partial | `src/server/notifications/academic-event-service.ts`, `firestore.rules`, API routes and rules tests. No verified scheduled worker/runtime processing. |
| Distributed/cloud database | Partial | `apphosting.yaml` defines private-ranges VPC and Secret Manager DB URL; Firebase/Cloud configuration exists. Deployment, backup and recovery evidence is incomplete. |
| Lecturer grading/import/approval | Partial to strong | Lecturer routes/services and upload parser exist; UI is newly implemented but broad E2E proof is absent. |
| Student results/GPA/transcript | Partial | Results, GPA UI, transcript API/download route exist; full carryover/retake/classification evidence is incomplete. |
| Administrator review/publication | Partial | `administrator-review-service.ts` and API routes exist; management workflows remain limited. |

## Database design review

### Inventory and integrity

Prisma models cover User, Student, Lecturer, Faculty, Department, Programme, AcademicSession, Semester, Course, CourseOffering, LecturerAssignment, ClassSchedule, Registration, AssessmentComponent, AssessmentScore, Result, ResultAuditHistory, ResultUploadBatch/Error, notifications/outbox and configuration. The core many-to-many relationships are normalized through `ProgrammeCourseRequirement`, `LecturerAssignment`, `CoursePrerequisite` and `Registration`.

Strengths:

- Unique identity/email/Firebase UID and student/lecturer identifiers.
- Unique registration and lecturer-assignment relations prevent duplicates.
- Foreign keys and restrictive deletes protect academic history.
- Result audit history and immutable-published-result protections are present in migrations.
- Class schedules are modelled separately from offerings.

Weaknesses:

- The audit observed application logs previously reporting missing `academic_event_outbox` despite its migration existing: this is production migration drift until proven otherwise.
- No database views, stored procedures or formal ERD-to-live-schema validation evidence was found.
- `ClassSchedule` lacks a natural unique constraint for course/day/start-time, so idempotent timetable provisioning needs application-level lookup.

Normalization: broadly 3NF; repeated facts are isolated in child/junction tables. No material denormalization issue was found.

## SQL optimisation

Portfolio 2 contains baseline and optimized SQL with `EXPLAIN (ANALYZE, BUFFERS)` evidence. Prisma queries are parameterized, pagination utilities exist, and core registration uses scoped selects. However, index claims are not supported by a large representative dataset or repeatable benchmark. Do not claim full SQL-optimization marks until a 1k+/- realistic dataset, plans, timings and promoted justified indexes are committed.

## Transactions and concurrency

Registration is the strongest area. The service locks offerings, checks capacity/prerequisites/timetable within a serializable transaction and inserts registrations atomically. Grade save, approval and publication use transactions and audit writes. Portfolio 3 reports duplicate, capacity, rollback, lock/retry and publication scenarios. Missing: explicit deadlock test evidence for every workflow and authenticated browser-level concurrency tests.

## NoSQL and cloud review

Firestore is used only as a non-authoritative notification/activity projection; rules deny client creation and scope reads/updates to a recipient. This is an appropriate pattern, but outbox processing has a deployment/migration gap and lacks production execution proof. Firebase Auth, App Hosting, Cloud SQL private networking, Secret Manager reference and VPC private-ranges configuration are present in `apphosting.yaml` and documentation. Backups, restore tests, Cloud Scheduler/worker evidence, IAM least-privilege review and monitoring runbooks are not evidenced in the repository.

## Security review

Strengths: Firebase token verification, active PostgreSQL identity linkage, role-specific guards, lecturer ownership checks, input validation with Zod, Prisma parameterization, result-lock checks and restrictive Firestore/Storage rules.

Critical concerns:

1. Production migration drift around `academic_event_outbox` must be resolved and documented.
2. Lecturer identity linking has recently required manual remediation; add an administrator-reviewed linking workflow and tests.
3. The current UI has limited authenticated end-to-end coverage for cross-student/cross-lecturer denial.
4. Avoid displaying account emails in public error strings in the final submission build.

## Application-functionality classification

| Area | Classification | Evidence |
|---|---|---|
| Student registration/drop/timetable | Partially working | Registration APIs/services and UI components exist; full E2E verification absent. |
| Student results/GPA/transcript | Partially working | Result/read/GPA/transcript routes/components exist; full academic-rule fixture evidence incomplete. |
| Lecturer classes/schedule/grades/upload/submit | Partially working | `lecturer-grading-service.ts`, lecturer routes and panels; needs E2E and data-model validation for component weights. |
| Admin review/publish | Partially working | `administrator-review-service.ts`, result APIs/panel; broader management is missing. |
| Notifications/activity | Partially working | Firestore projection/API/rules exist; background processing not fully verified. |
| Programme/course/session/user management | Missing or UI-limited | No complete administrator CRUD workflow found. |

## Testing

| Check | Result |
|---|---|
| Latest TypeScript/Next production build | PASS — repeatedly completed during current workspace work. |
| Isolated local DB suite | PASS — 15/15 tests passed on `nova_university_test_isolated` after migrations and deterministic seed. The original local test database was not reset. |
| Auth emulator tests | NOT RUN in this audit; repository tests exist. |
| Firestore rules tests | NOT RUN in this audit; repository tests exist. |
| Authenticated Playwright role flows | PARTIAL — only limited public security test coverage found. |
| Production smoke/backup/restore tests | NOT VERIFIED. |

## Provisional rubric score

| Category | Earned | Max | Rationale |
|---|---:|---:|---|
| Database design | 6.5 | 7 | Strong normalized schema/constraints/triggers; migration drift and schedule uniqueness deduction. |
| SQL optimization | 4 | 7 | Real plans exist, but no realistic-scale measured improvement. |
| Transactions/concurrency | 6 | 7 | Strong serializable/locking design and portfolio evidence; broader E2E/deadlock evidence missing. |
| NoSQL integration | 3.5 | 7 | Sound model/rules/APIs; outbox worker and deployment proof incomplete. |
| Distributed/cloud database | 3.5 | 6 | Private Cloud SQL/App Hosting/secret configuration evidenced; backups, worker, operations and runtime proof incomplete. |
| Documentation | 4.5 | 6 | Good architecture/database/portfolio docs; official rubric traceability, screenshots and verified operations evidence incomplete. |
| **Estimated assignment total** | **28/40** | **40** | **70% provisional estimate.** |

Overall technical-quality estimate: **70/100**. This is an improvement over the prior 24/40 estimate because the source now includes lecturer grading/import, result review/publication, transcript/API screens and live cloud architecture configuration. It is not a claim that every workflow is production-verified.

## Top 10 mark-reducing issues

1. Resolve and prove the production `academic_event_outbox` migration. Critical. +1–2 marks.
2. Add scaled SQL benchmark dataset and committed EXPLAIN before/after results. High. +2–3.
3. Prove Firestore outbox worker, retries/idempotency and deployed rules. High. +2–3.
4. Add cloud backup/PITR, restore and monitoring evidence. High. +1–2.
5. Add authenticated student/lecturer/admin E2E flows and denial tests. High. +2.
6. Complete administrator CRUD for students, lecturers, courses, programmes and sessions. High. +2–3.
7. Document grade scale, carryovers, retakes, degree classification and fixtures. Medium. +1–2.
8. Add standard component configuration (assignment, quiz, midterm, final) and validation tests. Medium. +1.
9. Add verified timetable/lecturer schedule data and conflict tests. Medium. +1.
10. Add diagrams/screenshots/submission guide mapped to the actual MIT rubric. Medium. +1.

## Roadmap to 39–40/40

1. **Correctness first:** migrate outbox, add a migration smoke check, protect production from drift, and capture logs/screenshots.
2. **Database performance:** load isolated 1,000+ representative students, capture EXPLAIN ANALYZE, select justified indexes, repeat benchmark.
3. **Workflow completion:** complete admin CRUD, review/rejection/publication, retake/carryover rules, standard assessment components, timetable constraints.
4. **NoSQL/cloud evidence:** Cloud Run outbox worker, Scheduler, dead-letter/retry evidence, Firestore rules deployment, backup/restore test.
5. **Assessment evidence:** authenticated Playwright test matrix, concurrency runs, test report, ERD, normalization explanation, API/security diagrams and a rubric traceability appendix.

## Final examiner-style verdict

The project has a solid database foundation and should score well for relational modelling and transaction design. It is currently closer to a strong database-systems prototype than a fully evidenced distributed academic platform. Prioritize operational proof, scaled SQL evidence and complete/admin-tested workflows rather than further cosmetic UI work.

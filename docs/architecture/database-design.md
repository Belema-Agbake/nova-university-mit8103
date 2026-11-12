# Database design

The schema is in 3NF. Identity is separate from academic structure, registration, assessment, result workflow and uploads. Repeating groups use child tables: schedules, components, scores, grade entries and audit rows.

`CourseOffering` resolves course/semester/programme delivery; `Registration` resolves student/offering enrolment; `AssessmentScore` resolves registration/component scoring; `Result` is one workflow record per registration. PostgreSQL triggers handle cross-table invariants that a simple check constraint cannot enforce.

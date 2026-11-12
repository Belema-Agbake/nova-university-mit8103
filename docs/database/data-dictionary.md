# PostgreSQL data dictionary

## Identity and organisation

| Tables | Purpose | Integrity rule |
|---|---|---|
| `users`, `students`, `lecturers`, `account_claims` | Secure identity and role linkage. | Email, Firebase UID, matriculation number and staff number are unique where applicable. |
| `faculties`, `departments`, `programmes` | Academic ownership hierarchy. | Department belongs to a faculty; programme belongs to a department. |

## Academic catalogue and delivery

| Tables | Purpose | Integrity rule |
|---|---|---|
| `academic_sessions`, `semesters`, `registration_periods` | Academic calendar and registration windows. | One term per session; period belongs to a semester. |
| `courses`, `course_prerequisites`, `programme_course_requirements` | Reusable curriculum. | Course codes are unique; prerequisite and programme requirement are junction tables. |
| `course_offerings`, `lecturer_assignments`, `class_schedules` | A course delivered to a programme in a semester. | Offering is unique per course/semester/programme; lecturer assignment is unique per lecturer/offering. |

## Assessment and results

| Tables | Purpose | Integrity rule |
|---|---|---|
| `registrations` | Student enrolment in an offering. | One registration per student/offering. |
| `assessment_components`, `assessment_scores` | Component marks and student scores. | One score per registration/component; database triggers protect component maximum and offering scope. |
| `grading_policies`, `grading_scale_entries` | Session/programme grading scheme. | Grade entries belong to one policy. |
| `results`, `result_audit_history` | Calculated outcome and immutable audit trail. | One result per registration; published results are protected by database trigger. |
| `result_upload_batches`, `result_upload_errors` | Lecturer spreadsheet import traceability. | Errors belong to a specific upload batch. |

## Notification and configuration

| Tables | Purpose | Integrity rule |
|---|---|---|
| `academic_event_outbox` | Durable PostgreSQL events awaiting Firestore delivery. | `eventKey` is unique; worker state tracks retry and lease ownership. |
| `academic_notifications` | Existing relational notification record. | Notification belongs to one user. |
| `academic_settings` | Typed application configuration stored as JSON. | Setting key is unique. |

## Normalisation summary

The schema is broadly in third normal form: person identity is separated from
student/lecturer roles, reusable courses are separated from semester-specific
offerings, and many-to-many relationships use junction tables. Firestore is
not part of the official result model; it is a projection for notifications.

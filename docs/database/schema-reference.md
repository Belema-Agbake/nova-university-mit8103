# Schema reference

| Area | Tables |
| --- | --- |
| Identity | users, students, lecturers |
| Structure | faculties, departments, programmes, academic_sessions, semesters, courses, course_prerequisites |
| Delivery | course_offerings, lecturer_assignments, class_schedules |
| Registration | registration_periods, programme_course_requirements, registrations |
| Assessment | grading_policies, grading_scale_entries, assessment_components, assessment_scores, results, result_audit_history |
| Uploads | result_upload_batches, result_upload_errors |
| Support | academic_notifications, academic_settings |

Prisma CUID IDs are internal; email, matriculation number, staff number and course code are unique business identifiers.

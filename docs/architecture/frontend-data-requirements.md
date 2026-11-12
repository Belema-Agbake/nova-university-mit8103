# Frontend data requirements

## Current status

`src/app/page.tsx` is a client-side visual preview. GPA, courses, students, enrolment and status arrays are fictional presentation data; no browser data is mixed with PostgreSQL records during Phase 2. Database reads are not securely available until Firebase Authentication exists.

| Area | Required future data |
| --- | --- |
| Student dashboard | Scoped profile/programme, registrations, published history; GPA/CGPA remains unavailable until the calculation service is approved. |
| Registration, courses, timetable | Registration window, programme requirements, offerings, prerequisites, registrations and schedules. |
| Results, transcript | Published results, semester/course records, grades and future verification records. |
| Lecturer views | Scoped assignments, rosters, components, draft results, upload batches/errors and submission audit. |
| Administrator views | Academic structure, sessions, programmes, people, offerings, assignments, policies and approval queue. |

The corresponding internal contracts live in `src/server/repositories` and `src/server/services`.

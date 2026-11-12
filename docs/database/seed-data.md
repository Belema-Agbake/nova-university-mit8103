# Seed data

`prisma/seed.ts` deletes in foreign-key-safe order then inserts deterministic fictional records: two faculties, two departments, two programmes, two sessions, three semesters, five courses, one lecturer, three students, four active offerings, schedules, registrations, 20/20/60 components, one published result, one draft result, one upload error and one notification.

No real personal data is used. Two verified consecutive seed runs produced 3 students, 4 offerings, 2 results and 12 components.

\pset pager off
ANALYZE;

\echo 'Q1 student registered courses'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT r.id, c.code, c.title, r.status
FROM registrations r
JOIN course_offerings co ON co.id = r."courseOfferingId"
JOIN courses c ON c.id = co."courseId"
WHERE r."studentId" = 'student_1'
  AND co."semesterId" = 'semester_2025_2'
  AND r.status IN ('PENDING', 'REGISTERED')
ORDER BY c.code;

\echo 'Q2 available course offerings'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT co.id, c.code, c.title, c.level
FROM course_offerings co
JOIN courses c ON c.id = co."courseId"
WHERE co."semesterId" = 'semester_2025_2'
  AND co."programmeId" = 'prog_bsc_cs'
  AND c.level <= 400
ORDER BY c.code;

\echo 'Q3 lecturer assigned courses'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT la.id, co.id, c.code
FROM lecturer_assignments la
JOIN course_offerings co ON co.id = la."courseOfferingId"
JOIN courses c ON c.id = co."courseId"
WHERE la."lecturerId" = 'lecturer_michael'
  AND co."semesterId" = 'semester_2025_2'
ORDER BY c.code;

\echo 'Q4 lecturer course roster'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT r.id, s."matriculationNumber"
FROM registrations r
JOIN students s ON s.id = r."studentId"
WHERE r."courseOfferingId" = 'offering_course_csc401'
  AND r.status = 'REGISTERED'
ORDER BY s."matriculationNumber"
LIMIT 50 OFFSET 0;

\echo 'Q5 administrator pending result approvals'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT r.id, r.status, r."submittedAt"
FROM results r
JOIN registrations reg ON reg.id = r."registrationId"
WHERE r.status IN ('SUBMITTED', 'CHANGES_REQUESTED')
ORDER BY r."submittedAt", r.id
LIMIT 50;

\echo 'Q6 student published results'
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT r.id, r."totalScore", r."letterGrade", r."gradePoint"
FROM results r
JOIN registrations reg ON reg.id = r."registrationId"
WHERE r.status = 'PUBLISHED'
  AND reg."studentId" = 'student_1'
ORDER BY r."publishedAt" DESC;

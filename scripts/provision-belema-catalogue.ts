import { loadEnvConfig } from "@next/env";
import { PrismaClient, UserRole, AccountVerificationStatus } from "@prisma/client";
loadEnvConfig(process.cwd());

const url = process.env.TARGET_DATABASE_URL;
if (!url) throw new Error("TARGET_DATABASE_URL is required.");
const parsed = new URL(url);
if (parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "::1" && process.env.ALLOW_PRODUCTION_PROVISION !== "true") throw new Error("Production provisioning requires ALLOW_PRODUCTION_PROVISION=true.");
const prisma = new PrismaClient({ datasources: { db: { url } } });
const firebaseUid = process.env.BELEMA_FIREBASE_UID;
if (!firebaseUid) throw new Error("BELEMA_FIREBASE_UID is required.");
const catalogue = [
  ["CSC 101", "Introduction to Computer Science", "CORE", 3, 100], ["CSC 102", "Introduction to Programming with Python", "CORE", 3, 100], ["CSC 103", "Computer Appreciation and Applications", "DEPARTMENTAL", 2, 100], ["MTH 101", "Elementary Mathematics I", "CORE", 3, 100], ["MTH 102", "Calculus I", "CORE", 3, 100], ["CSC 104", "Introduction to Web Development", "DEPARTMENTAL", 3, 100], ["GST 101", "Use of English and Communication Skills", "CORE", 2, 100], ["PHY 101", "General Physics I", "CORE", 3, 100], ["CSC 105", "Introduction to Digital Logic", "ELECTIVE", 2, 100], ["CSC 106", "Fundamentals of Information Technology", "ELECTIVE", 2, 100],
  ["CSC 201", "Object-Oriented Programming with Java", "CORE", 3, 200], ["CSC 202", "Data Structures and Algorithms I", "CORE", 3, 200], ["CSC 203", "Database Management Systems", "CORE", 3, 200], ["CSC 204", "Computer Architecture and Organisation", "DEPARTMENTAL", 3, 200], ["CSC 205", "Discrete Mathematics", "CORE", 3, 200], ["CSC 206", "Frontend Development with JavaScript", "DEPARTMENTAL", 3, 200], ["CSC 207", "Operating Systems Fundamentals", "CORE", 3, 200], ["STA 201", "Probability and Statistics", "CORE", 2, 200], ["CSC 208", "Introduction to Linux Administration", "ELECTIVE", 2, 200], ["CSC 209", "UI/UX Design Fundamentals", "ELECTIVE", 2, 200],
  ["CSC 301", "Advanced Data Structures and Algorithms", "CORE", 3, 300], ["CSC 302", "Software Engineering", "CORE", 3, 300], ["CSC 303", "Advanced Database Systems", "CORE", 3, 300], ["CSC 304", "Computer Networks", "CORE", 3, 300], ["CSC 305", "Backend Development and REST APIs", "DEPARTMENTAL", 3, 300], ["CSC 306", "Mobile Application Development", "DEPARTMENTAL", 3, 300], ["CSC 307", "Cybersecurity Fundamentals", "CORE", 3, 300], ["CSC 308", "Introduction to Artificial Intelligence", "CORE", 3, 300], ["CSC 309", "Game Development Fundamentals", "ELECTIVE", 2, 300], ["CSC 310", "Introduction to Blockchain Technology", "ELECTIVE", 2, 300],
  ["CSC 401", "Machine Learning", "CORE", 3, 400], ["CSC 402", "Cloud Computing and Distributed Systems", "CORE", 3, 400], ["CSC 403", "Full-Stack Web Application Development", "DEPARTMENTAL", 3, 400], ["CSC 404", "Advanced Software Architecture", "CORE", 3, 400], ["CSC 405", "Data Science and Big Data Analytics", "CORE", 3, 400], ["CSC 406", "DevOps and CI/CD Engineering", "DEPARTMENTAL", 3, 400], ["CSC 407", "Ethical Hacking and Network Security", "CORE", 3, 400], ["CSC 408", "Research Methods in Computer Science", "CORE", 3, 400], ["CSC 409", "Natural Language Processing", "ELECTIVE", 2, 400], ["CSC 410", "Internet of Things (IoT)", "ELECTIVE", 2, 400],
  ["CSC 501", "Advanced Algorithms and Complexity", "CORE", 3, 500], ["CSC 502", "Compiler Design and Construction", "CORE", 3, 500], ["CSC 503", "Parallel and Distributed Computing", "CORE", 3, 500], ["CSC 504", "Information Systems Management", "DEPARTMENTAL", 3, 500], ["CSC 505", "Technology Entrepreneurship", "DEPARTMENTAL", 3, 500], ["CSC 506", "Advanced Human Computer Interaction", "ELECTIVE", 3, 500], ["CSC 599", "Final Year Research Project and Defence", "CORE", 6, 500],
] as const;
const resultScores: Record<string, number> = { "CSC 101": 78, "CSC 102": 66, "CSC 103": 72, "MTH 101": 58, "MTH 102": 64, "CSC 104": 81, "GST 101": 69, "PHY 101": 53, "CSC 105": 74, "CSC 201": 73, "CSC 202": 62, "CSC 203": 77, "CSC 204": 55, "CSC 205": 68, "CSC 206": 84, "CSC 207": 61, "STA 201": 59, "CSC 208": 67, "CSC 301": 80, "CSC 302": 74, "CSC 303": 69, "CSC 304": 65, "CSC 305": 83, "CSC 306": 76, "CSC 307": 58, "CSC 308": 71, "CSC 309": 63, "CSC 401": 85, "CSC 402": 79, "CSC 403": 88, "CSC 404": 67, "CSC 405": 75, "CSC 406": 82, "CSC 407": 63, "CSC 408": 91, "CSC 409": 76 };
const academicYears = [
  { level: 100, name: "2022/2023", sessionId: "session_2022_2023", start: "2022-09-01", end: "2023-08-31", first: ["2022-09-01", "2023-01-31"], second: ["2023-02-01", "2023-06-30"] },
  { level: 200, name: "2023/2024", sessionId: "session_2023_2024", start: "2023-09-01", end: "2024-08-31", first: ["2023-09-01", "2024-01-31"], second: ["2024-02-01", "2024-06-30"] },
  { level: 300, name: "2024/2025", sessionId: "session_2024_2025_historical", start: "2024-09-01", end: "2025-08-31", first: ["2024-09-01", "2025-01-31"], second: ["2025-02-01", "2025-06-30"] },
  { level: 400, name: "2025/2026", sessionId: "session_2025_2026_historical", start: "2025-09-01", end: "2026-08-31", first: ["2025-09-01", "2026-01-31"], second: ["2026-02-01", "2026-06-30"] },
  { level: 500, name: "2026/2027", sessionId: "session_2026_2027", start: "2026-09-01", end: "2027-08-31", first: ["2026-09-01", "2027-01-31"], second: ["2027-02-01", "2027-06-30"] },
] as const;
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const grade = (score: number): [string, number] => score >= 70 ? ["A", 5] : score >= 60 ? ["B", 4] : score >= 50 ? ["C", 3] : score >= 45 ? ["D", 2] : score >= 40 ? ["E", 1] : ["F", 0];
const scaleEntries: readonly [string, number, number, number][] = [["A", 70, 100, 5], ["B", 60, 69.99, 4], ["C", 50, 59.99, 3], ["D", 45, 49.99, 2], ["E", 40, 44.99, 1], ["F", 0, 39.99, 0]];

async function main() {
  const result = await prisma.$transaction(async tx => {
    const faculty = await tx.faculty.upsert({ where: { code: "FC" }, update: { name: "Faculty of Computing" }, create: { id: "fac_computing", code: "FC", name: "Faculty of Computing" } });
    const department = await tx.department.upsert({ where: { code: "CSC" }, update: { name: "Computer Science", facultyId: faculty.id }, create: { id: "dept_cs", code: "CSC", name: "Computer Science", facultyId: faculty.id } });
    const programme = await tx.programme.upsert({ where: { code: "BSC-CS" }, update: { name: "Computer Science and Programming", durationYears: 5, departmentId: department.id }, create: { id: "prog_bsc_cs", code: "BSC-CS", name: "Computer Science and Programming", award: "B.Sc.", durationYears: 5, departmentId: department.id } });
    const sessions = new Map<number, { sessionId: string; firstId: string; secondId: string }>();
    for (const academicYear of academicYears) {
      const existingSession = await tx.academicSession.findUnique({ where: { name: academicYear.name }, select: { id: true } });
      const sessionId = existingSession?.id ?? academicYear.sessionId;
      await tx.academicSession.upsert({ where: { id: sessionId }, update: { name: academicYear.name, startDate: date(academicYear.start), endDate: date(academicYear.end) }, create: { id: sessionId, name: academicYear.name, startDate: date(academicYear.start), endDate: date(academicYear.end) } });
      const existingFirst = await tx.semester.findUnique({ where: { sessionId_term: { sessionId, term: "FIRST" } }, select: { id: true } });
      const existingSecond = await tx.semester.findUnique({ where: { sessionId_term: { sessionId, term: "SECOND" } }, select: { id: true } });
      const firstId = existingFirst?.id ?? `${sessionId}_belema_first`;
      const secondId = existingSecond?.id ?? `${sessionId}_belema_second`;
      const current = academicYear.level === 500;
      await tx.semester.upsert({ where: { id: firstId }, update: { sessionId, term: "FIRST", startDate: date(academicYear.first[0]), endDate: date(academicYear.first[1]), isCurrent: false }, create: { id: firstId, sessionId, term: "FIRST", startDate: date(academicYear.first[0]), endDate: date(academicYear.first[1]), isCurrent: false } });
      await tx.semester.upsert({ where: { id: secondId }, update: { sessionId, term: "SECOND", startDate: date(academicYear.second[0]), endDate: date(academicYear.second[1]), isCurrent: current }, create: { id: secondId, sessionId, term: "SECOND", startDate: date(academicYear.second[0]), endDate: date(academicYear.second[1]), isCurrent: current } });
      sessions.set(academicYear.level, { sessionId, firstId, secondId });
    }
    const courses = [];
    for (const [code, title, type, units, level] of catalogue) {
      const id = `course_${code.toLowerCase().replace(/\s/g, "")}`;
      const course = await tx.course.upsert({ where: { code }, update: { title, creditUnits: units, level, departmentId: department.id }, create: { id, code, title, creditUnits: units, level, departmentId: department.id } });
      courses.push(course);
      await tx.programmeCourseRequirement.upsert({ where: { programmeId_courseId: { programmeId: programme.id, courseId: course.id } }, update: { isRequired: type !== "ELECTIVE", recommendedSemester: level / 100 }, create: { programmeId: programme.id, courseId: course.id, isRequired: type !== "ELECTIVE", recommendedSemester: level / 100 } });
    }
    const user = await tx.user.upsert({ where: { email: "belemaagbake@gmail.com" }, update: { firebaseUid, firstName: "Belema", lastName: "Agbake", role: UserRole.STUDENT, accountStatus: AccountVerificationStatus.ACTIVE }, create: { email: "belemaagbake@gmail.com", firebaseUid, firstName: "Belema", lastName: "Agbake", role: UserRole.STUDENT, accountStatus: AccountVerificationStatus.ACTIVE } });
    const student = await tx.student.upsert({ where: { userId: user.id }, update: { programmeId: programme.id, officialLevel: 500 }, create: { userId: user.id, matriculationNumber: "PROV-301898585", programmeId: programme.id, entryYear: new Date().getUTCFullYear() - 4, officialLevel: 500 } });
    const policies = new Map<number, string>();
    for (const academicYear of academicYears) {
      const sessionId = sessions.get(academicYear.level)!.sessionId;
      const policy = await tx.gradingPolicy.upsert({ where: { sessionId_programmeId_name: { sessionId, programmeId: programme.id, name: "Nova five-point scale" } }, update: { isDefault: true }, create: { id: `policy_${sessionId}_bsc_cs`, sessionId, programmeId: programme.id, name: "Nova five-point scale", isDefault: true } });
      policies.set(academicYear.level, policy.id);
      for (const [index, entry] of scaleEntries.entries()) await tx.gradingScaleEntry.upsert({ where: { id: `grade_${sessionId}_${index}` }, update: { grade: entry[0], minimumScore: entry[1], maximumScore: entry[2], gradePoint: entry[3], gradingPolicyId: policy.id }, create: { id: `grade_${sessionId}_${index}`, gradingPolicyId: policy.id, grade: entry[0], minimumScore: entry[1], maximumScore: entry[2], gradePoint: entry[3] } });
    }
    for (const [code, score] of Object.entries(resultScores)) {
      const course = courses.find(item => item.code === code)!;
      const year = academicYears.find(item => item.level === course.level)!;
      const session = sessions.get(course.level)!;
      const courseIndex = catalogue.findIndex(item => item[0] === code) % 10;
      const semesterId = courseIndex < 5 ? session.firstId : session.secondId;
      const existingOffering = await tx.courseOffering.findUnique({ where: { courseId_semesterId_programmeId: { courseId: course.id, semesterId, programmeId: programme.id } }, select: { id: true } });
      const offering = existingOffering ? await tx.courseOffering.update({ where: { id: existingOffering.id }, data: { capacity: 1 } }) : await tx.courseOffering.create({ data: { id: `belema_offering_${course.id}_${semesterId}`, courseId: course.id, semesterId, programmeId: programme.id, capacity: 1 } });
      const registration = await tx.registration.upsert({ where: { studentId_courseOfferingId: { studentId: student.id, courseOfferingId: offering.id } }, update: { status: "REGISTERED" }, create: { id: `belema_registration_${course.id}`, studentId: student.id, courseOfferingId: offering.id, status: "REGISTERED" } });
      const component = await tx.assessmentComponent.upsert({ where: { courseOfferingId_name: { courseOfferingId: offering.id, name: "Final result" } }, update: { weightPercent: 100, maximumScore: 100 }, create: { id: `belema_component_${course.id}`, courseOfferingId: offering.id, name: "Final result", weightPercent: 100, maximumScore: 100 } });
      await tx.assessmentScore.upsert({ where: { registrationId_assessmentComponentId: { registrationId: registration.id, assessmentComponentId: component.id } }, update: { score }, create: { id: `belema_score_${course.id}`, registrationId: registration.id, assessmentComponentId: component.id, score } });
      const [letterGrade, gradePoint] = grade(score);
      const result = await tx.result.upsert({ where: { registrationId: registration.id }, update: { totalScore: score, letterGrade, gradePoint, status: "DRAFT", publishedAt: null }, create: { id: `belema_result_${course.id}`, registrationId: registration.id, totalScore: score, letterGrade, gradePoint, status: "DRAFT" } });
      await tx.resultAuditHistory.upsert({ where: { id: `belema_audit_${course.id}` }, update: { resultId: result.id, action: "CREATED", details: { source: "historical-import", level: course.level, semesterId, gradingPolicyId: policies.get(year.level) } }, create: { id: `belema_audit_${course.id}`, resultId: result.id, action: "CREATED", details: { source: "historical-import", level: course.level, semesterId, gradingPolicyId: policies.get(year.level) } } });
    }
    // Keep the complete programme catalogue available for registration. A course
    // remains selectable until it has a published result; draft/imported scores
    // must not make a course disappear from the offering list.
    const current = sessions.get(500)!;
    for (const course of courses) {
      for (const semesterId of [current.firstId, current.secondId]) {
        await tx.courseOffering.upsert({
          where: { courseId_semesterId_programmeId: { courseId: course.id, semesterId, programmeId: programme.id } },
          update: { capacity: 60 },
          create: { id: `belema_current_offering_${course.id}_${semesterId}`, courseId: course.id, semesterId, programmeId: programme.id, capacity: 60 },
        });
      }
    }
    return { programme, department, user, student, courseCount: courses.length, resultCount: Object.keys(resultScores).length };
  }, { timeout: 60000 });
  console.log(JSON.stringify({ ...result, database: parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" ? "local" : "production", results: "imported as DRAFT; not published", correctedTotals: { attemptedUnits: 101, qualityPoints: 444, cgpa: 444 / 101 } }, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

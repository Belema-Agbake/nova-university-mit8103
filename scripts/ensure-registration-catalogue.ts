import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const catalogue = [
  ["CSC 101", "Introduction to Computer Science", 100, 3], ["CSC 102", "Introduction to Programming", 100, 3], ["MTH 101", "Elementary Mathematics I", 100, 3], ["GST 101", "Use of English", 100, 2], ["PHY 101", "General Physics I", 100, 3],
  ["CSC 201", "Object-Oriented Programming", 200, 3], ["CSC 202", "Data Structures and Algorithms", 200, 3], ["CSC 203", "Database Management Systems", 200, 3], ["STA 201", "Probability and Statistics", 200, 2], ["CSC 204", "Computer Architecture", 200, 3],
  ["CSC 301", "Advanced Data Structures", 300, 3], ["CSC 302", "Software Engineering", 300, 3], ["CSC 303", "Advanced Database Systems", 300, 3], ["CSC 304", "Computer Networks", 300, 3], ["CSC 305", "Backend Development", 300, 3],
  ["CSC 401", "Machine Learning", 400, 3], ["CSC 402", "Cloud Computing", 400, 3], ["CSC 403", "Full-Stack Web Development", 400, 3], ["CSC 404", "Advanced Software Architecture", 400, 3], ["CSC 405", "Research Methods", 400, 3],
  ["CSC 501", "Advanced Algorithms and Complexity", 500, 3], ["CSC 502", "Compiler Design", 500, 3], ["CSC 503", "Parallel and Distributed Computing", 500, 3], ["CSC 504", "Information Systems Management", 500, 3], ["CSC 599", "Final Year Research Project", 500, 6],
] as const;

async function main() {
  const programme = await prisma.programme.findUniqueOrThrow({ where: { code: "BSC-CS" } });
  const department = await prisma.department.findUniqueOrThrow({ where: { id: programme.departmentId } });
  const session = await prisma.academicSession.upsert({ where: { id: "session_2026_2027" }, update: {}, create: { id: "session_2026_2027", name: "2026/2027", startDate: date("2026-09-01"), endDate: date("2027-08-31") } });
  const first = await prisma.semester.upsert({ where: { id: "semester_2026_2027_1" }, update: { isCurrent: false }, create: { id: "semester_2026_2027_1", sessionId: session.id, term: "FIRST", startDate: date("2026-09-01"), endDate: date("2027-01-31"), isCurrent: false } });
  await prisma.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  const second = await prisma.semester.upsert({ where: { id: "semester_2026_2027_2" }, update: { isCurrent: true }, create: { id: "semester_2026_2027_2", sessionId: session.id, term: "SECOND", startDate: date("2027-02-01"), endDate: date("2027-06-30"), isCurrent: true } });
  await prisma.semester.updateMany({ where: { id: { notIn: [first.id, second.id] } }, data: { isCurrent: false } });
  for (const [code, title, level, units] of catalogue) {
    const course = await prisma.course.upsert({ where: { code }, update: { title, level, creditUnits: units, departmentId: department.id }, create: { id: `course_${code.toLowerCase().replace(/\s/g, "")}`, code, title, level, creditUnits: units, departmentId: department.id } });
    await prisma.programmeCourseRequirement.upsert({ where: { programmeId_courseId: { programmeId: programme.id, courseId: course.id } }, update: { isRequired: true }, create: { programmeId: programme.id, courseId: course.id, isRequired: true, recommendedSemester: level / 100 } });
    for (const semester of [first, second]) await prisma.courseOffering.upsert({ where: { courseId_semesterId_programmeId: { courseId: course.id, semesterId: semester.id, programmeId: programme.id } }, update: { capacity: 60 }, create: { id: `offering_${course.id}_${semester.id}`, courseId: course.id, semesterId: semester.id, programmeId: programme.id, capacity: 60 } });
  }
  console.log(`Created ${catalogue.length} courses for both semesters.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

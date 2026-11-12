import { PrismaClient, ResultStatus, UserRole } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const time = (value: string) => new Date(`1970-01-01T${value}:00.000Z`);

/**
 * Rebuilds a deterministic fictional academic dataset. Delete order follows FK
 * dependencies so rerunning the seed is safe without disabling constraints.
 */
async function resetSeedData() {
  await prisma.$transaction(async (transaction) => {
    await transaction.resultAuditHistory.deleteMany();
    await transaction.resultUploadError.deleteMany();
    await transaction.resultUploadBatch.deleteMany();
    await transaction.academicEventOutbox.deleteMany();
    await transaction.assessmentScore.deleteMany();
    await transaction.result.deleteMany();
    await transaction.assessmentComponent.deleteMany();
    await transaction.registration.deleteMany();
    await transaction.classSchedule.deleteMany();
    await transaction.lecturerAssignment.deleteMany();
    await transaction.courseOffering.deleteMany();
    await transaction.registrationPeriod.deleteMany();
    await transaction.gradingScaleEntry.deleteMany();
    await transaction.gradingPolicy.deleteMany();
    await transaction.programmeCourseRequirement.deleteMany();
    await transaction.coursePrerequisite.deleteMany();
    await transaction.course.deleteMany();
    await transaction.semester.deleteMany();
    await transaction.academicSession.deleteMany();
    await transaction.student.deleteMany();
    await transaction.lecturer.deleteMany();
    await transaction.academicNotification.deleteMany();
    await transaction.academicSetting.deleteMany();
    await transaction.programme.deleteMany();
    await transaction.department.deleteMany();
    await transaction.faculty.deleteMany();
    await transaction.user.deleteMany();
  });
}

async function seed() {
  await resetSeedData();

  const computingFaculty = await prisma.faculty.create({ data: { id: "fac_computing", code: "FC", name: "Faculty of Computing" } });
  const sciencesFaculty = await prisma.faculty.create({ data: { id: "fac_sciences", code: "FS", name: "Faculty of Sciences" } });
  const computerScience = await prisma.department.create({ data: { id: "dept_cs", code: "CSC", name: "Computer Science", facultyId: computingFaculty.id } });
  const mathematics = await prisma.department.create({ data: { id: "dept_math", code: "MAT", name: "Mathematics", facultyId: sciencesFaculty.id } });
  const computerScienceProgramme = await prisma.programme.create({ data: { id: "prog_bsc_cs", code: "BSC-CS", name: "Computer Science", award: "B.Sc.", durationYears: 4, departmentId: computerScience.id } });
  await prisma.programme.create({ data: { id: "prog_bsc_math", code: "BSC-MAT", name: "Mathematics", award: "B.Sc.", durationYears: 4, departmentId: mathematics.id } });

  const session2025 = await prisma.academicSession.create({ data: { id: "session_2025", name: "2025/2026", startDate: date("2025-09-01"), endDate: date("2026-08-31") } });
  const session2024 = await prisma.academicSession.create({ data: { id: "session_2024", name: "2024/2025", startDate: date("2024-09-01"), endDate: date("2025-08-31") } });
  const secondSemester = await prisma.semester.create({ data: { id: "semester_2025_2", sessionId: session2025.id, term: "SECOND", startDate: date("2026-02-02"), endDate: date("2026-06-30"), isCurrent: true } });
  await prisma.semester.create({ data: { id: "semester_2025_1", sessionId: session2025.id, term: "FIRST", startDate: date("2025-09-08"), endDate: date("2026-01-23") } });
  await prisma.semester.create({ data: { id: "semester_2024_2", sessionId: session2024.id, term: "SECOND", startDate: date("2025-02-03"), endDate: date("2025-06-27") } });
  await prisma.registrationPeriod.create({ data: { id: "reg_period_current", semesterId: secondSemester.id, opensAt: new Date("2026-01-05T08:00:00Z"), closesAt: new Date("2026-03-31T23:59:59Z"), isActive: true } });

  const courses = await Promise.all([
    prisma.course.create({ data: { id: "course_csc401", code: "CSC 401", title: "Software Engineering", creditUnits: 3, level: 400, departmentId: computerScience.id } }),
    prisma.course.create({ data: { id: "course_csc403", code: "CSC 403", title: "Database Systems II", creditUnits: 3, level: 400, departmentId: computerScience.id } }),
    prisma.course.create({ data: { id: "course_csc405", code: "CSC 405", title: "Artificial Intelligence", creditUnits: 3, level: 400, departmentId: computerScience.id } }),
    prisma.course.create({ data: { id: "course_csc407", code: "CSC 407", title: "Human Computer Interaction", creditUnits: 2, level: 400, departmentId: computerScience.id } }),
    prisma.course.create({ data: { id: "course_csc301", code: "CSC 301", title: "Algorithms and Complexity", creditUnits: 3, level: 300, departmentId: computerScience.id } }),
  ]);
  await prisma.coursePrerequisite.create({ data: { courseId: "course_csc401", prerequisiteCourseId: "course_csc301" } });
  await prisma.programmeCourseRequirement.createMany({ data: courses.map((course, index) => ({ programmeId: computerScienceProgramme.id, courseId: course.id, isRequired: true, recommendedSemester: index < 4 ? 8 : 6 })) });

  const admin = await prisma.user.create({ data: { id: "user_admin", firebaseUid: "firebase-emulator-admin", email: "ada.administrator@nova.test", firstName: "Ada", lastName: "Nwosu", role: UserRole.ADMINISTRATOR, accountStatus: "ACTIVE" } });
  const lecturerUser = await prisma.user.create({ data: { id: "user_lecturer", firebaseUid: "firebase-emulator-michael", email: "michael.lecturer@nova.test", firstName: "Michael", lastName: "Adewale", role: UserRole.LECTURER, accountStatus: "ACTIVE" } });
  const lecturer = await prisma.lecturer.create({ data: { id: "lecturer_michael", userId: lecturerUser.id, departmentId: computerScience.id, staffNumber: "LEC/CS/014" } });
  const studentUsers = await Promise.all([
    ["user_amina", "firebase-emulator-amina", "amina.student@nova.test", "Amina", "Bello", "STU/21/0821"],
    ["user_daniel", "firebase-emulator-daniel", "daniel.okafor@nova.example.test", "Daniel", "Okafor", "STU/21/0828"],
    ["user_ifeoma", "firebase-emulator-ifeoma", "ifeoma.nwosu@nova.example.test", "Ifeoma", "Nwosu", "STU/21/0835"],
  ].map(async ([id, firebaseUid, email, firstName, lastName]) => prisma.user.create({ data: { id, firebaseUid, email, firstName, lastName, role: UserRole.STUDENT, accountStatus: "ACTIVE" } })));
  const students = await Promise.all(studentUsers.map((user, index) => prisma.student.create({ data: { id: `student_${index + 1}`, userId: user.id, matriculationNumber: ["STU/21/0821", "STU/21/0828", "STU/21/0835"][index], programmeId: computerScienceProgramme.id, entryYear: 2021, officialLevel: 400 } })));

  const offerings = await Promise.all(courses.slice(0, 4).map((course) => prisma.courseOffering.create({ data: { id: `offering_${course.id}`, courseId: course.id, semesterId: secondSemester.id, programmeId: computerScienceProgramme.id, capacity: 60 } })));
  await prisma.lecturerAssignment.createMany({ data: offerings.map((offering, index) => ({ id: `assignment_${index + 1}`, lecturerId: lecturer.id, courseOfferingId: offering.id, isLead: true })) });
  await prisma.classSchedule.createMany({ data: [
    { id: "schedule_1", courseOfferingId: offerings[0].id, weekday: 1, startTime: time("10:00"), endTime: time("12:00"), room: "ENG-104" },
    { id: "schedule_2", courseOfferingId: offerings[1].id, weekday: 2, startTime: time("09:00"), endTime: time("11:00"), room: "ICT-201" },
    { id: "schedule_3", courseOfferingId: offerings[2].id, weekday: 5, startTime: time("13:00"), endTime: time("15:00"), room: "CS-LAB-3" },
    { id: "schedule_4", courseOfferingId: offerings[3].id, weekday: 3, startTime: time("14:00"), endTime: time("16:00"), room: "ICT-104" },
  ] });

  const policy = await prisma.gradingPolicy.create({ data: { id: "policy_2025_cs", sessionId: session2025.id, programmeId: computerScienceProgramme.id, name: "B.Sc. Computer Science standard scale", isDefault: true } });
  await prisma.gradingScaleEntry.createMany({ data: [
    ["A", 70, 100, 5], ["B", 60, 69.99, 4], ["C", 50, 59.99, 3], ["D", 45, 49.99, 2], ["F", 0, 44.99, 0],
  ].map(([grade, minimumScore, maximumScore, gradePoint], index) => ({ id: `grade_${index + 1}`, gradingPolicyId: policy.id, grade: String(grade), minimumScore: String(minimumScore), maximumScore: String(maximumScore), gradePoint: String(gradePoint) })) });
  await prisma.assessmentComponent.createMany({ data: offerings.flatMap((offering) => [
    { id: `component_${offering.id}_assignment`, courseOfferingId: offering.id, name: "Assignment", weightPercent: "20", maximumScore: "20" },
    { id: `component_${offering.id}_midterm`, courseOfferingId: offering.id, name: "Midterm", weightPercent: "20", maximumScore: "20" },
    { id: `component_${offering.id}_final`, courseOfferingId: offering.id, name: "Final examination", weightPercent: "60", maximumScore: "60" },
  ]) });
  const registrations = await Promise.all(students.flatMap((student) => offerings.map((offering) => prisma.registration.create({ data: { id: `registration_${student.id}_${offering.id}`, studentId: student.id, courseOfferingId: offering.id, status: "REGISTERED" } }))));
  const aminaFirstRegistration = registrations.find((registration) => registration.studentId === students[0].id && registration.courseOfferingId === offerings[0].id)!;
  const componentIds = ["assignment", "midterm", "final"].map((suffix) => `component_${offerings[0].id}_${suffix}`);
  await prisma.assessmentScore.createMany({ data: [16, 17, 51].map((score, index) => ({ id: `score_amina_${index + 1}`, registrationId: aminaFirstRegistration.id, assessmentComponentId: componentIds[index], score: String(score) })) });
  const publishedResult = await prisma.result.create({ data: { id: "result_amina_csc401", registrationId: aminaFirstRegistration.id, totalScore: "84", letterGrade: "A", gradePoint: "5", status: ResultStatus.PUBLISHED, submittedAt: new Date("2026-03-10T12:00:00Z"), publishedAt: new Date("2026-03-12T12:00:00Z") } });
  await prisma.resultAuditHistory.create({ data: { id: "audit_result_1", resultId: publishedResult.id, actorId: admin.id, action: "PUBLISHED", details: { source: "deterministic-seed" } } });
  await prisma.result.create({ data: { id: "result_draft", registrationId: registrations.find((registration) => registration.studentId === students[1].id && registration.courseOfferingId === offerings[1].id)!.id, status: ResultStatus.DRAFT } });
  await prisma.resultUploadBatch.create({ data: { id: "upload_1", courseOfferingId: offerings[1].id, lecturerId: lecturer.id, originalFilename: "csc403-second-semester.xlsx", status: "VALIDATED", errors: { create: { id: "upload_error_1", rowNumber: 5, field: "final_score", message: "Final score exceeds the component maximum.", rawValue: "66" } } } });
  await prisma.academicNotification.create({ data: { id: "notification_1", userId: studentUsers[0].id, title: "Published result available", message: "CSC 401 Software Engineering is available in your academic history." } });
  await prisma.academicSetting.create({ data: { id: "setting_assessment", key: "default_assessment_weights", value: { assignment: 20, midterm: 20, finalExamination: 60 } } });
  await prisma.$disconnect();
}

seed().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });

import { NextRequest, NextResponse } from "next/server";

import { requireAuthenticatedStudent } from "@/server/authorization/require-student";
import { apiError } from "@/server/http/api-response";
import { getRegistrationSummary } from "@/server/registration/registration-service";

export async function GET(request: NextRequest) { try { const student = await requireAuthenticatedStudent(request); const summary = await getRegistrationSummary(student, request.nextUrl.searchParams.get("semesterId") ?? undefined); return NextResponse.json({ semester: summary.semester, entries: summary.courses.flatMap(course => course.schedules.map(schedule => ({ ...schedule, code: course.code, title: course.title, registrationStatus: course.status }))) }); } catch (error) { return apiError(error); } }

import { NextRequest, NextResponse } from "next/server";

import { requireAuthenticatedStudent } from "@/server/authorization/require-student";
import { apiError } from "@/server/http/api-response";
import { listAvailableCourses } from "@/server/registration/registration-service";
import { availabilityQuerySchema } from "@/server/registration/schemas";

export async function GET(request: NextRequest) { try { const student = await requireAuthenticatedStudent(request); const query = availabilityQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams)); return NextResponse.json({ courses: await listAvailableCourses(student, query.semesterId, query.level) }); } catch (error) { return apiError(error); } }

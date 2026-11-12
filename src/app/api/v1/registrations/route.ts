import { NextRequest, NextResponse } from "next/server";

import { requireAuthenticatedStudent } from "@/server/authorization/require-student";
import { apiError } from "@/server/http/api-response";
import { getRegistrationSummary, submitRegistration } from "@/server/registration/registration-service";
import { registrationSubmissionSchema } from "@/server/registration/schemas";

export async function GET(request: NextRequest) { try { const student = await requireAuthenticatedStudent(request); return NextResponse.json(await getRegistrationSummary(student, request.nextUrl.searchParams.get("semesterId") ?? undefined)); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { const student = await requireAuthenticatedStudent(request); const payload = registrationSubmissionSchema.parse(await request.json()); const registration = await submitRegistration(student, payload.semesterId, payload.courseOfferingIds); return NextResponse.json(registration, { status: 201 }); } catch (error) { return apiError(error); } }

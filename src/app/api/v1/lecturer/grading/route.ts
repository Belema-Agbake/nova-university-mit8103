import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedLecturer } from "@/server/authorization/require-lecturer";
import { apiError } from "@/server/http/api-response";
import { listLecturerGradingCourses, saveLecturerGrades } from "@/server/grading/lecturer-grading-service";

const bodySchema = z.object({ offeringId: z.string().min(1), submit: z.boolean().default(false), grades: z.array(z.object({ registrationId: z.string().min(1), componentId: z.string().min(1), score: z.coerce.number().finite() })).min(1) });
export async function GET(request: NextRequest) { try { const lecturer = await requireAuthenticatedLecturer(request); const semesterId = request.nextUrl.searchParams.get("semesterId"); if (!semesterId) return NextResponse.json({ error: { code: "SEMESTER_REQUIRED", message: "semesterId is required." } }, { status: 400 }); return NextResponse.json(await listLecturerGradingCourses(lecturer.id, semesterId)); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { const lecturer = await requireAuthenticatedLecturer(request); const body = bodySchema.parse(await request.json()); return NextResponse.json(await saveLecturerGrades(lecturer.id, lecturer.userId, body.offeringId, body.grades, body.submit)); } catch (error) { return apiError(error); } }

import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedLecturer } from "@/server/authorization/require-lecturer";
import { apiError } from "@/server/http/api-response";
import { submitLecturerResults } from "@/server/grading/lecturer-grading-service";
export async function POST(request: NextRequest, context: { params: Promise<{ offeringId: string }> }) { try { const lecturer = await requireAuthenticatedLecturer(request); const { offeringId } = await context.params; return NextResponse.json(await submitLecturerResults(lecturer.id, lecturer.userId, offeringId)); } catch (error) { return apiError(error); } }

import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedLecturer } from "@/server/authorization/require-lecturer";
import { apiError } from "@/server/http/api-response";
import { getLecturerRoster } from "@/server/grading/lecturer-grading-service";
export async function GET(request: NextRequest, context: { params: Promise<{ offeringId: string }> }) { try { const lecturer = await requireAuthenticatedLecturer(request); const { offeringId } = await context.params; return NextResponse.json(await getLecturerRoster(lecturer.id, offeringId)); } catch (error) { return apiError(error); } }

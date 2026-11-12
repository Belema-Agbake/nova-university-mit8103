import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/server/authorization/require-user";
import { apiError } from "@/server/http/api-response";
import { publishApprovedResult } from "@/server/grading/administrator-review-service";
export async function POST(request: NextRequest, context: { params: Promise<{ resultId: string }> }) { try { const admin = await requireUser(request, [UserRole.ADMINISTRATOR]); const { resultId } = await context.params; return NextResponse.json(await publishApprovedResult(admin.id, resultId)); } catch (error) { return apiError(error); } }

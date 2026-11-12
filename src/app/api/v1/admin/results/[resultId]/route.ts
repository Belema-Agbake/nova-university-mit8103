import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/server/authorization/require-user";
import { apiError } from "@/server/http/api-response";
import { reviewResult } from "@/server/grading/administrator-review-service";
import { z } from "zod";
const schema = z.object({ action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]), reason: z.string().max(1000).optional() });
export async function POST(request: NextRequest, context: { params: Promise<{ resultId: string }> }) { try { const admin = await requireUser(request, [UserRole.ADMINISTRATOR]); const { resultId } = await context.params; const body = schema.parse(await request.json()); return NextResponse.json(await reviewResult(admin.id, resultId, body.action, body.reason)); } catch (error) { return apiError(error); } }

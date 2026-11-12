import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/server/authorization/require-user";
import { apiError } from "@/server/http/api-response";
import { listSubmittedResults } from "@/server/grading/administrator-review-service";
import { paginationQuerySchema } from "@/server/validation/pagination";
export async function GET(request: NextRequest) { try { await requireUser(request, [UserRole.ADMINISTRATOR]); return NextResponse.json(await listSubmittedResults(paginationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams)))); } catch (error) { return apiError(error); } }

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/authorization/require-user";
import { apiError } from "@/server/http/api-response";
export async function GET(request: NextRequest) { try { return NextResponse.json(await requireUser(request)); } catch(error) { return apiError(error); } }

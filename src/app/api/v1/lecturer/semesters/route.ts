import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedLecturer } from "@/server/authorization/require-lecturer";
import { listRegistrationSemesters } from "@/server/registration/registration-service";
import { apiError } from "@/server/http/api-response";

export async function GET(request: NextRequest) { try { await requireAuthenticatedLecturer(request); return NextResponse.json({ semesters: await listRegistrationSemesters() }, { headers: { "Cache-Control": "no-store, max-age=0" } }); } catch (error) { const response = apiError(error); response.headers.set("Cache-Control", "no-store, max-age=0"); return response; } }

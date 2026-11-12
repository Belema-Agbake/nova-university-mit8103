import { NextRequest, NextResponse } from "next/server";

import { requireAuthenticatedStudent } from "@/server/authorization/require-student";
import { apiError } from "@/server/http/api-response";
import { listRegistrationSemesters } from "@/server/registration/registration-service";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedStudent(request);
    return NextResponse.json({ semesters: await listRegistrationSemesters() });
  } catch (error) {
    return apiError(error);
  }
}

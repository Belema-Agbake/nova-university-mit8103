import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/server/authorization/require-user";
import { apiError } from "@/server/http/api-response";
import { listActivityPage, processPendingAcademicEvents } from "@/server/notifications/academic-event-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const pageSize = Math.min(Math.max(Number(request.nextUrl.searchParams.get("pageSize") ?? 20), 1), 50);
    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    await processPendingAcademicEvents(25, user.firebaseUid);
    return NextResponse.json(await listActivityPage(user.firebaseUid, cursor, pageSize));
  } catch (error) {
    return apiError(error);
  }
}

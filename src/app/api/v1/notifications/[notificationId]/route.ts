import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/server/authorization/require-user";
import { apiError } from "@/server/http/api-response";
import { markNotificationRead } from "@/server/notifications/academic-event-service";

export async function PATCH(request: NextRequest, context: { params: Promise<{ notificationId: string }> }) {
  try {
    const user = await requireUser(request);
    const { notificationId } = await context.params;
    await markNotificationRead(user.firebaseUid, notificationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

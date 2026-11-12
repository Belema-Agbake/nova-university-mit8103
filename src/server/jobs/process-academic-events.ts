import "server-only";

import { processPendingAcademicEvents } from "@/server/notifications/academic-event-service";

/** Cloud Run worker entry point. The caller should authenticate before calling it. */
export async function processAcademicEventBatch() {
  const processed = await processPendingAcademicEvents(100);
  return { processed };
}

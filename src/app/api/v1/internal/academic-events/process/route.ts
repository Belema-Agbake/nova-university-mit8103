import { NextResponse } from "next/server";

import { processAcademicEventBatch } from "@/server/jobs/process-academic-events";

/**
 * This route exists only in the dedicated, IAM-protected Cloud Run worker.
 * App Hosting deliberately does not set NOVA_WORKER_RUNTIME, so it cannot be
 * used as a public application endpoint.
 */
export async function POST() {
  if (process.env.NOVA_WORKER_RUNTIME !== "true") return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    return NextResponse.json(await processAcademicEventBatch());
  } catch {
    return NextResponse.json({ error: "Academic-event processing failed." }, { status: 500 });
  }
}

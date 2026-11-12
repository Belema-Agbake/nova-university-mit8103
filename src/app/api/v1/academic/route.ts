import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/server/authorization/require-authentication";
import { ApplicationError } from "@/server/errors/application-error";

/**
 * Intentionally fail-closed until Firebase Authentication and server-side role
 * verification are implemented. The data services exist but are never exposed
 * through an unauthenticated route.
 */
export async function GET() {
  try {
    requireAuthenticatedUser();
  } catch (error) {
    if (error instanceof ApplicationError) {
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
    }
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } }, { status: 500 });
  }
}

import "server-only";

import { AuthenticationRequiredError } from "@/server/errors/application-error";

/**
 * Phase 2 deliberately has no identity fallback. Role selection in the UI is a
 * presentation-only preview and must never become a substitute for authentication.
 */
export function requireAuthenticatedUser(): never {
  throw new AuthenticationRequiredError();
}

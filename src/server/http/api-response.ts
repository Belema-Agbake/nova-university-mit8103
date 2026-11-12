import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { ApplicationError } from "@/server/errors/application-error";

export function apiError(error: unknown) {
  if (error instanceof ApplicationError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.statusCode });
  if (error instanceof ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "The request is invalid.", details: error.flatten() } }, { status: 400 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return NextResponse.json({ error: { code: "REGISTRATION_CONFLICT", message: "Registration changed while it was being processed. Refresh and try again." } }, { status: 409 });
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } }, { status: 500 });
}

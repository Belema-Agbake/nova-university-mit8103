import { NextRequest, NextResponse } from "next/server";

import { requireAuthenticatedStudent } from "@/server/authorization/require-student";
import { apiError } from "@/server/http/api-response";
import { dropRegistration } from "@/server/registration/registration-service";

export async function DELETE(request: NextRequest, context: { params: Promise<{ registrationId: string }> }) { try { const student = await requireAuthenticatedStudent(request); const { registrationId } = await context.params; return NextResponse.json(await dropRegistration(student, registrationId)); } catch (error) { return apiError(error); } }

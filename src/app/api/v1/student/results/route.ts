import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedStudent } from "@/server/authorization/require-student";
import { getStudentAcademicHistory } from "@/server/repositories/student-repository";
import { apiError } from "@/server/http/api-response";
export async function GET(request: NextRequest) { try { const student = await requireAuthenticatedStudent(request); return NextResponse.json(await getStudentAcademicHistory(student.id)); } catch (error) { return apiError(error); } }

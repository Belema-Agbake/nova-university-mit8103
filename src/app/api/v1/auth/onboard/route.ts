import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { firebaseAdminAuth } from "@/server/authentication/firebase-admin";
import { createImmediateAccount } from "@/server/authentication/account-service";
import { apiError } from "@/server/http/api-response";
import { AuthenticationRequiredError } from "@/server/errors/application-error";
const schema = z.object({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), role: z.enum([UserRole.STUDENT, UserRole.LECTURER]), suppliedId: z.string().trim().min(3).max(80) });
export async function POST(request: NextRequest) { try { const token=request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1]; if(!token) throw new AuthenticationRequiredError(); const decoded=await firebaseAdminAuth().verifyIdToken(token, true); if(!decoded.email) throw new AuthenticationRequiredError(); const body=schema.parse(await request.json()); const user=await createImmediateAccount({firebaseUid:decoded.uid,email:decoded.email,...body}); return NextResponse.json({id:user.id,role:user.role,academicAccess:false},{status:201}); } catch(error) { return apiError(error); } }

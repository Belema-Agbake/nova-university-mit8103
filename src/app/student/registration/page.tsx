"use client";
import { RoleDashboard } from "@/components/auth/role-dashboard";
import { RegistrationWorkflow } from "@/components/student/registration-workflow";
export default function StudentRegistrationPage() { return <RoleDashboard role="STUDENT" title="Course registration" content={<RegistrationWorkflow />} />; }

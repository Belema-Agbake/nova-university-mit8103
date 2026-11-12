"use client";
import { RoleDashboard } from "@/components/auth/role-dashboard";
import { RegistrationWorkflow } from "@/components/student/registration-workflow";
export default function RegisteredCoursesPage() { return <RoleDashboard role="STUDENT" title="My registered courses" content={<RegistrationWorkflow view="registered" />} />; }

"use client";
import { RoleDashboard } from "@/components/auth/role-dashboard";
import { LecturerGradingPanel } from "@/components/lecturer/grading-panel";
export default function Page() { return <RoleDashboard role="LECTURER" title="Result entry" content={<LecturerGradingPanel view="entry" />} />; }

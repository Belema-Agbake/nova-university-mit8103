"use client";
import { RoleDashboard } from "@/components/auth/role-dashboard";
import { LecturerGradingPanel } from "@/components/lecturer/grading-panel";
export default function Page() { return <RoleDashboard role="LECTURER" title="Class schedule" content={<LecturerGradingPanel view="roster" />} />; }

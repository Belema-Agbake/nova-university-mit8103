"use client";
import { RoleDashboard } from "@/components/auth/role-dashboard";
import { StudentAcademicResultsPanel } from "@/components/student/academic-results-panel";
export default function StudentResultsPage() { return <RoleDashboard role="STUDENT" title="Semester results" content={<StudentAcademicResultsPanel />} />; }

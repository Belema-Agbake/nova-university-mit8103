"use client";
import { RoleDashboard } from "@/components/auth/role-dashboard";
import { GpaCalculator } from "@/components/student/gpa-calculator";
export default function GpaCalculatorPage() { return <RoleDashboard role="STUDENT" title="GPA calculator" content={<GpaCalculator />} />; }

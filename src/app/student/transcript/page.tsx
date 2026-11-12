"use client";
import { RoleDashboard } from "@/components/auth/role-dashboard";
import { StudentAcademicResultsPanel } from "@/components/student/academic-results-panel";
export default function StudentTranscriptPage() { return <RoleDashboard role="STUDENT" title="Transcript" content={<div className="space-y-6"><div><h2 className="text-2xl font-bold">Academic transcript</h2><p className="mt-1 text-sm text-[#718096]">Published academic history verified from PostgreSQL.</p></div><TranscriptDownloadButton className="inline-flex min-h-11 items-center rounded-xl bg-[#173B63] px-5 text-sm font-semibold text-white hover:bg-[#0F2D4D] disabled:opacity-60" /><StudentAcademicResultsPanel /></div>} />; }
import { TranscriptDownloadButton } from "@/components/student/transcript-download-button";

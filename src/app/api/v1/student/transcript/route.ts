import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAuthenticatedStudent } from "@/server/authorization/require-student";
import { getStudentAcademicHistory } from "@/server/repositories/student-repository";
import { apiError } from "@/server/http/api-response";

type TranscriptData = Awaited<ReturnType<typeof getStudentAcademicHistory>>;

async function drawTranscriptPage(pdf: PDFDocument, data: TranscriptData, level?: number) {
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.09, 0.23, 0.39);
  const teal = rgb(0.14, 0.42, 0.45);
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.97, 0.98, 0.99) });
  page.drawRectangle({ x: 0, y: 770, width: 595, height: 72, color: navy });
  page.drawText("NOVA UNIVERSITY", { x: 40, y: 807, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText("OFFICIAL ACADEMIC TRANSCRIPT", { x: 40, y: 786, size: 9, font: bold, color: rgb(0.82, 0.9, 0.94) });
  let y = 738;
  page.drawText(`${data.student.user.firstName} ${data.student.user.lastName}`, { x: 40, y, size: 16, font: bold, color: navy });
  y -= 22;
  page.drawText(`Student ID: ${data.student.matriculationNumber}`, { x: 40, y, size: 9, font: regular, color: navy });
  page.drawText(`Programme: ${data.student.programme.name} (${data.student.programme.code})`, { x: 300, y, size: 9, font: regular, color: navy });
  y -= 16;
  page.drawText(`Current level: ${data.currentLevel}`, { x: 40, y, size: 9, font: regular, color: navy });
  page.drawText(`Classification: ${data.cumulative.classification}`, { x: 300, y, size: 9, font: regular, color: navy });
  y -= 34;
  page.drawRectangle({ x: 40, y: y - 16, width: 515, height: 34, color: rgb(0.88, 0.94, 0.95) });
  page.drawText(`Cumulative GPA: ${data.cumulative.cgpa.toFixed(2)} / 5.00`, { x: 52, y: y - 4, size: 11, font: bold, color: teal });
  page.drawText(`${data.cumulative.attemptedUnits} attempted units | ${data.cumulative.qualityPoints} quality points`, { x: 300, y: y - 4, size: 9, font: regular, color: navy });
  y -= 52;
  page.drawText(level ? `${level} Level Results` : "Published Academic Results", { x: 40, y, size: 13, font: bold, color: navy });
  y -= 20;
  page.drawRectangle({ x: 36, y: y - 6, width: 523, height: 20, color: teal });
  const headers = ["Full Course Name (Course Code)", "Units", "Score", "Grade"];
  const xs = [40, 430, 480, 525];
  headers.forEach((header, index) => page.drawText(header, { x: xs[index]!, y, size: 7, font: bold, color: rgb(1, 1, 1) }));
  y -= 18;
  const rows = data.results.filter(item => !level || item.level === level);
  for (const row of rows) {
    if (y < 70) break;
    page.drawText(row.displayName.slice(0, 48), { x: 40, y, size: 7.5, font: regular, color: navy });
    page.drawText(String(row.units), { x: 434, y, size: 8, font: regular, color: navy });
    page.drawText(String(row.score), { x: 484, y, size: 8, font: regular, color: navy });
    page.drawText(row.grade ?? "-", { x: 529, y, size: 8, font: bold, color: navy });
    page.drawLine({ start: { x: 40, y: y - 5 }, end: { x: 555, y: y - 5 }, thickness: 0.3, color: rgb(0.82, 0.86, 0.89) });
    y -= 18;
  }
  if (!rows.length) page.drawText("No published results are available.", { x: 40, y, size: 9, font: regular, color: navy });
  page.drawText("This transcript contains only results approved and published by Nova University.", { x: 40, y: 38, size: 7, font: regular, color: rgb(0.3, 0.38, 0.45) });
  page.drawText("Nova University Academic Records Office", { x: 390, y: 38, size: 7, font: bold, color: navy });
}

export async function GET(request: NextRequest) {
  try {
    const student = await requireAuthenticatedStudent(request);
    const data = await getStudentAcademicHistory(student.id);
    const pdf = await PDFDocument.create();
    const levels = [...new Set(data.results.map(item => item.level))].sort((a, b) => a - b);
    if (!levels.length) await drawTranscriptPage(pdf, data);
    else for (const level of levels) await drawTranscriptPage(pdf, data, level);
    const bytes = await pdf.save();
    return new NextResponse(bytes as BodyInit, { headers: { "content-type": "application/pdf", "content-disposition": "attachment; filename=Nova-University-Transcript.pdf", "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}

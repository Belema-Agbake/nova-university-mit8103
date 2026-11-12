export type GradeBand = { minimum: number; maximum: number; letter: string; gradePoint: number };
export type AcademicAttempt = { courseId: string; courseCode: string; courseTitle: string; level: number; semesterId: string; creditUnits: number; score: number; published: boolean; complete: boolean; attemptNumber?: number };
export type CalculatedAttempt = AcademicAttempt & { letterGrade: string; gradePoint: number; qualityPoints: number; isRetake: boolean };

export const FIVE_POINT_SCALE: GradeBand[] = [
  { minimum: 70, maximum: 100, letter: "A", gradePoint: 5 },
  { minimum: 60, maximum: 69.9999, letter: "B", gradePoint: 4 },
  { minimum: 50, maximum: 59.9999, letter: "C", gradePoint: 3 },
  { minimum: 45, maximum: 49.9999, letter: "D", gradePoint: 2 },
  { minimum: 40, maximum: 44.9999, letter: "E", gradePoint: 1 },
  { minimum: 0, maximum: 39.9999, letter: "F", gradePoint: 0 },
];

export function gradeForScore(score: number, scale: GradeBand[] = FIVE_POINT_SCALE) {
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error("Score must be between 0 and 100.");
  const band = scale.find(item => score >= item.minimum && score <= item.maximum);
  if (!band) throw new Error("No grading band matches the score.");
  return band;
}

export function calculateAcademicResults(attempts: AcademicAttempt[]) {
  const published = attempts.filter(attempt => attempt.published && attempt.complete).map(attempt => {
    if (!Number.isInteger(attempt.creditUnits) || attempt.creditUnits <= 0) throw new Error("Credit units must be positive integers.");
    const grade = gradeForScore(attempt.score);
    return { ...attempt, letterGrade: grade.letter, gradePoint: grade.gradePoint, qualityPoints: attempt.creditUnits * grade.gradePoint, isRetake: false };
  });
  const grouped = new Map<string, CalculatedAttempt[]>();
  for (const attempt of published) grouped.set(attempt.courseId, [...(grouped.get(attempt.courseId) ?? []), attempt]);
  const selected = [...grouped.values()].map(courseAttempts => {
    const ordered = [...courseAttempts].sort((left, right) => (right.attemptNumber ?? 1) - (left.attemptNumber ?? 1));
    const current = ordered[0]!;
    return { ...current, isRetake: ordered.length > 1 };
  });
  const attemptedUnits = selected.reduce((sum, attempt) => sum + attempt.creditUnits, 0);
  const qualityPoints = selected.reduce((sum, attempt) => sum + attempt.qualityPoints, 0);
  const gpa = attemptedUnits ? qualityPoints / attemptedUnits : 0;
  return { attempts: selected, attemptedUnits, qualityPoints, gpa, classification: degreeClassification(gpa) };
}

export function degreeClassification(cgpa: number) {
  if (cgpa >= 4.5) return "First Class Honours";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa >= 1) return "Pass";
  return "Below Minimum Classification Threshold";
}

export function calculateCumulativeResults(attempts: AcademicAttempt[]) {
  const result = calculateAcademicResults(attempts);
  return { ...result, cgpa: result.gpa, classification: degreeClassification(result.gpa) };
}

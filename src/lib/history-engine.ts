import type {
  AcademicHistoryResponse,
  HistoricalCourse,
  SubjectCategory,
  SubjectSummary,
  Term,
  LETTER_GRADES as LetterGradesType,
} from "./types";
import { LETTER_GRADES } from "./types";
import { classifyCourse } from "./subject-classifier";

function letterFor(grade: number): string {
  for (const lg of LETTER_GRADES) {
    if (grade >= lg.min) return lg.letter;
  }
  return "F";
}

function gpaFor(grade: number): number {
  for (const lg of LETTER_GRADES) {
    if (grade >= lg.min) return lg.gpa;
  }
  return 0.0;
}

/**
 * Simple linear regression slope on an array of numbers.
 * Returns slope per index (positive = improving).
 */
export function linearSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) * (i - meanX);
  }
  return den === 0 ? 0 : num / den;
}

function slopeToTrend(slope: number): "improving" | "declining" | "stable" {
  if (slope > 0.5) return "improving";
  if (slope < -0.5) return "declining";
  return "stable";
}

interface RawCourse {
  id: string;
  name: string;
  finalScore: number | null;
  currentScore: number | null;
  isActive: boolean;
  term: Term | null;
}

export function buildAcademicHistory(
  studentId: string,
  studentName: string,
  rawCourses: RawCourse[],
  overrides: Record<string, SubjectCategory>
): AcademicHistoryResponse {
  // 1. Filter courses with grades and assign terms
  const termsMap = new Map<string, Term>();
  const coursesWithGrades: {
    raw: RawCourse;
    grade: number;
    termId: string;
    termName: string;
  }[] = [];

  for (const rc of rawCourses) {
    const grade = rc.isActive ? rc.currentScore : rc.finalScore;
    if (grade == null) continue;

    const termId = rc.term?.id ?? "other";
    const termName = rc.term?.name ?? "Other";

    if (!termsMap.has(termId)) {
      termsMap.set(termId, {
        id: termId,
        name: termName,
        startAt: rc.term?.startAt ?? null,
        endAt: rc.term?.endAt ?? null,
      });
    }

    coursesWithGrades.push({ raw: rc, grade, termId, termName });
  }

  // Sort terms by startAt (oldest first), fallback to name
  const terms = Array.from(termsMap.values()).sort((a, b) => {
    if (a.startAt && b.startAt) return a.startAt.localeCompare(b.startAt);
    if (a.startAt) return -1;
    if (b.startAt) return 1;
    return a.name.localeCompare(b.name);
  });

  const termOrder = new Map(terms.map((t, i) => [t.id, i]));

  // 2. Compute per-term averages
  const termGrades = new Map<string, number[]>();
  for (const c of coursesWithGrades) {
    if (!termGrades.has(c.termId)) termGrades.set(c.termId, []);
    termGrades.get(c.termId)!.push(c.grade);
  }
  const termAvg = new Map<string, number>();
  for (const [tid, grades] of termGrades) {
    termAvg.set(tid, grades.reduce((a, b) => a + b, 0) / grades.length);
  }

  // 3. Build HistoricalCourse[]
  const historicalCourses: HistoricalCourse[] = coursesWithGrades.map((c) => {
    const category = overrides[c.raw.name] ?? classifyCourse(c.raw.name);
    const strengthIndex = Math.round((c.grade - (termAvg.get(c.termId) ?? c.grade)) * 10) / 10;

    return {
      id: c.raw.id,
      name: c.raw.name,
      termId: c.termId,
      termName: c.termName,
      finalGrade: c.grade,
      letterGrade: letterFor(c.grade),
      subjectCategory: category,
      isActive: c.raw.isActive,
      strengthIndex,
    };
  });

  // Sort by term order
  historicalCourses.sort(
    (a, b) => (termOrder.get(a.termId) ?? 999) - (termOrder.get(b.termId) ?? 999)
  );

  // 4. Build SubjectSummary per category
  const categoryMap = new Map<SubjectCategory, HistoricalCourse[]>();
  for (const hc of historicalCourses) {
    if (!categoryMap.has(hc.subjectCategory)) categoryMap.set(hc.subjectCategory, []);
    categoryMap.get(hc.subjectCategory)!.push(hc);
  }

  const subjectSummaries: SubjectSummary[] = [];
  for (const [category, courses] of categoryMap) {
    const grades = courses
      .filter((c) => c.finalGrade != null)
      .map((c) => ({
        termId: c.termId,
        termName: c.termName,
        grade: c.finalGrade!,
        courseName: c.name,
      }));

    const avgGrade = grades.reduce((s, g) => s + g.grade, 0) / grades.length;
    const avgStrength =
      courses.reduce((s, c) => s + c.strengthIndex, 0) / courses.length;

    const trend =
      grades.length >= 3
        ? slopeToTrend(linearSlope(grades.map((g) => g.grade)))
        : "stable";

    const strengthLabel: "strong" | "average" | "weak" =
      avgStrength > 3 ? "strong" : avgStrength < -3 ? "weak" : "average";

    subjectSummaries.push({
      category,
      averageGrade: Math.round(avgGrade * 10) / 10,
      courseCount: courses.length,
      trend,
      strengthLabel,
      grades,
    });
  }

  // Sort weakest first
  const strengthOrder = { weak: 0, average: 1, strong: 2 };
  subjectSummaries.sort(
    (a, b) => strengthOrder[a.strengthLabel] - strengthOrder[b.strengthLabel]
  );

  // 5. Compute termGPAs
  const termGPAs = terms.map((term) => {
    const coursesInTerm = historicalCourses.filter((c) => c.termId === term.id);
    const gpas = coursesInTerm
      .filter((c) => c.finalGrade != null)
      .map((c) => gpaFor(c.finalGrade!));
    const avg = gpas.length > 0 ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
    return {
      termId: term.id,
      termName: term.name,
      gpa: Math.round(avg * 100) / 100,
    };
  });

  // 6. Overall trajectory
  const gpaValues = termGPAs.map((t) => t.gpa).filter((g) => g > 0);
  const overallTrajectory =
    gpaValues.length >= 3
      ? slopeToTrend(linearSlope(gpaValues) * 5) // scale up since GPA range is small
      : "stable";

  return {
    studentId,
    studentName,
    terms,
    courses: historicalCourses,
    subjectSummaries,
    overallTrajectory,
    termGPAs,
  };
}

import {
  Course,
  CategoryTrend,
  GradeTarget,
  CourseForecast,
  LETTER_GRADES,
} from "./types";
import {
  gradableAssignments,
  calculateGradeBreakdown,
  getLetterGrade,
} from "./grade-engine";

/**
 * Calculate per-category performance trends for a course.
 */
export function calculateCategoryTrends(course: Course): CategoryTrend[] {
  return course.assignmentGroups.map((group) => {
    const gradable = gradableAssignments(group.assignments);

    let gradedEarned = 0;
    let gradedPossible = 0;
    let gradedCount = 0;
    let remainingCount = 0;

    for (const a of gradable) {
      if (a.score !== null) {
        gradedEarned += a.score;
        gradedPossible += a.pointsPossible;
        gradedCount++;
      } else {
        remainingCount++;
      }
    }

    const averageScore =
      gradedPossible > 0 ? (gradedEarned / gradedPossible) * 100 : 0;

    const total = gradedCount + remainingCount;
    const riskScore =
      total > 0 ? (group.weight / 100) * (remainingCount / total) : 0;

    return {
      groupId: group.id,
      groupName: group.name,
      weight: group.weight,
      averageScore: Math.round(averageScore * 10) / 10,
      gradedCount,
      remainingCount,
      riskScore: Math.round(riskScore * 1000) / 1000,
    };
  });
}

/**
 * Project final grade by filling ungraded assignments with
 * their category-specific average score.
 */
export function projectFinalGrade(
  course: Course,
  trends: CategoryTrend[]
): number {
  const trendMap = new Map(trends.map((t) => [t.groupId, t]));

  const modifiedGroups = course.assignmentGroups.map((group) => {
    const trend = trendMap.get(group.id);
    const avgPct = trend && trend.gradedCount > 0 ? trend.averageScore : 70; // fallback to 70% if no graded work

    return {
      ...group,
      assignments: group.assignments.map((a) => {
        if (
          a.score === null &&
          !a.excused &&
          !a.omitFromFinalGrade &&
          a.pointsPossible > 0
        ) {
          return {
            ...a,
            score: a.pointsPossible * (avgPct / 100),
            submitted: true,
            missing: false,
          };
        }
        return a;
      }),
    };
  });

  const modifiedCourse: Course = { ...course, assignmentGroups: modifiedGroups };
  const breakdown = calculateGradeBreakdown(modifiedCourse);
  return breakdown.currentGrade;
}

/**
 * Calculate what average score on remaining work is needed for each letter grade.
 * Uses two-point linear interpolation (grade is linear w.r.t. uniform remaining score).
 */
export function calculateGradeTargets(course: Course): GradeTarget[] {
  // Simulate all remaining at 0% and 100% to get the linear relationship
  function simulateAllRemaining(pct: number): number {
    const modified = course.assignmentGroups.map((group) => ({
      ...group,
      assignments: group.assignments.map((a) => {
        if (
          a.score === null &&
          !a.excused &&
          !a.omitFromFinalGrade &&
          a.pointsPossible > 0
        ) {
          return { ...a, score: a.pointsPossible * (pct / 100), submitted: true, missing: false };
        }
        return a;
      }),
    }));
    const modCourse: Course = { ...course, assignmentGroups: modified };
    return calculateGradeBreakdown(modCourse).currentGrade;
  }

  const gradeAt0 = simulateAllRemaining(0);
  const gradeAt100 = simulateAllRemaining(100);
  const slope = gradeAt100 - gradeAt0; // grade change per 100% of remaining

  const currentGrade = calculateGradeBreakdown(course).currentGrade;
  const currentLetter = getLetterGrade(currentGrade);
  const currentIdx = LETTER_GRADES.findIndex((lg) => lg.letter === currentLetter);

  const targets: GradeTarget[] = [];

  // Show targets from A down to one below current
  const stopIdx = Math.min(currentIdx + 2, LETTER_GRADES.length);
  for (let i = 0; i < stopIdx; i++) {
    const { letter, min: minGrade } = LETTER_GRADES[i];

    let requiredAverage: number;
    if (slope <= 0) {
      // No remaining work — either already there or impossible
      requiredAverage = currentGrade >= minGrade ? 0 : Infinity;
    } else {
      // Solve: gradeAt0 + (requiredAvg/100) * slope >= minGrade
      requiredAverage = ((minGrade - gradeAt0) / slope) * 100;
    }

    targets.push({
      letter,
      minGrade,
      requiredAverage: Math.round(requiredAverage * 10) / 10,
      feasible: requiredAverage <= 100 && requiredAverage >= 0,
    });
  }

  return targets;
}

/**
 * Generate complete forecast for a single course.
 */
export function generateCourseForecast(course: Course): CourseForecast {
  const trends = calculateCategoryTrends(course);
  const projectedFinalGrade = projectFinalGrade(course, trends);
  const targets = calculateGradeTargets(course);

  // Risk category: highest riskScore among categories with remaining work
  const riskCategory =
    trends
      .filter((t) => t.remainingCount > 0)
      .sort((a, b) => b.riskScore - a.riskScore)[0] ?? null;

  return {
    courseId: course.id,
    courseName: course.name,
    projectedFinalGrade: Math.round(projectedFinalGrade * 100) / 100,
    projectedLetterGrade: getLetterGrade(projectedFinalGrade),
    categoryTrends: trends,
    targets,
    riskCategory,
  };
}

/**
 * Generate forecasts for all courses.
 */
export function generateForecasts(courses: Course[]): CourseForecast[] {
  return courses.map(generateCourseForecast);
}

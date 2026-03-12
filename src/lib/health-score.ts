import {
  GradeOptimizerResponse,
  CourseForecast,
  LETTER_GRADES,
  ChildHealthScore,
} from "./types";

/**
 * Calculate a 0-100 health score for a child.
 *
 * Components:
 *   GPA (30pts)             — maps 0.0-4.0 GPA to 0-30
 *   Missing Work (25pts)    — penalty: -5 per missing, floor 0
 *   Trend Direction (20pts) — forecast GPA vs current GPA
 *   Cliff Risk (15pts)      — courses near letter grade boundary
 *   Workload Compliance (10pts) — ratio of completed vs total upcoming
 */
export function calculateHealthScore(
  data: GradeOptimizerResponse
): ChildHealthScore {
  // 1. GPA component (0-30)
  // 4.0 = 30, 3.0 = 22.5, 2.0 = 15, 0.0 = 0
  const gpaComponent = Math.min(30, (data.overallGPA / 4.0) * 30);

  // 2. Missing work penalty (0-25, starts at 25, loses 5 per missing)
  const missingWorkPenalty = Math.max(0, 25 - data.totalMissing * 5);

  // 3. Trend direction (0-20)
  // Compare forecast GPA to current GPA
  let forecastGPA = data.overallGPA;
  if (data.forecasts.length > 0) {
    forecastGPA =
      data.forecasts.reduce((sum, f) => {
        const entry = LETTER_GRADES.find(
          (lg) => f.projectedFinalGrade >= lg.min
        );
        return sum + (entry?.gpa ?? 0);
      }, 0) / data.forecasts.length;
  }
  const trendDiff = forecastGPA - data.overallGPA;
  // Rising = full 20, flat = 15, declining = 0-10
  let trendComponent: number;
  if (trendDiff >= 0.1) {
    trendComponent = 20;
  } else if (trendDiff >= -0.05) {
    trendComponent = 15;
  } else {
    // Declining: scale from 10 down to 0
    trendComponent = Math.max(0, 10 + trendDiff * 20);
  }

  // 4. Cliff risk (0-15)
  // Count courses within 3% of a letter grade drop
  let coursesAtCliff = 0;
  for (const forecast of data.forecasts) {
    const currentThreshold = [...forecast.targets]
      .filter((t) => t.minGrade <= forecast.projectedFinalGrade)
      .sort((a, b) => b.minGrade - a.minGrade)[0];
    if (
      currentThreshold &&
      forecast.projectedFinalGrade - currentThreshold.minGrade < 3
    ) {
      coursesAtCliff++;
    }
  }
  const cliffRiskComponent = Math.max(0, 15 - coursesAtCliff * 5);

  // 5. Workload compliance (0-10)
  // Based on ratio of overdue items to total action items
  const totalTodos = data.todos.length;
  const overdue = data.todos.filter(
    (t) => t.status === "missing" || t.status === "late"
  ).length;
  let workloadCompliance: number;
  if (totalTodos === 0) {
    workloadCompliance = 10; // nothing to do = full compliance
  } else {
    workloadCompliance = Math.round(
      ((totalTodos - overdue) / totalTodos) * 10
    );
  }

  const score = Math.round(
    gpaComponent +
      missingWorkPenalty +
      trendComponent +
      cliffRiskComponent +
      workloadCompliance
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  let level: "green" | "yellow" | "red";
  if (clampedScore >= 80) level = "green";
  else if (clampedScore >= 60) level = "yellow";
  else level = "red";

  return {
    score: clampedScore,
    level,
    gpaComponent: Math.round(gpaComponent * 10) / 10,
    missingWorkPenalty: Math.round(missingWorkPenalty * 10) / 10,
    trendComponent: Math.round(trendComponent * 10) / 10,
    cliffRiskComponent: Math.round(cliffRiskComponent * 10) / 10,
    workloadCompliance: Math.round(workloadCompliance * 10) / 10,
  };
}

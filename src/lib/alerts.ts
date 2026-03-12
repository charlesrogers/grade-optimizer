import {
  GradeOptimizerResponse,
  CourseForecast,
  PredictiveAlert,
  LETTER_GRADES,
} from "./types";

/**
 * Generate predictive alerts from existing forecast + todo data.
 * Reframes analytics as actionable warnings.
 */
export function generateAlerts(
  data: GradeOptimizerResponse
): PredictiveAlert[] {
  const alerts: PredictiveAlert[] = [];

  for (const forecast of data.forecasts) {
    // CLIFF ALERT — course within 3% of letter grade drop
    const currentThreshold = [...forecast.targets]
      .filter((t) => t.minGrade <= forecast.projectedFinalGrade)
      .sort((a, b) => b.minGrade - a.minGrade)[0];

    if (currentThreshold) {
      const margin =
        forecast.projectedFinalGrade - currentThreshold.minGrade;
      if (margin < 3 && margin >= 0) {
        alerts.push({
          id: `cliff-${forecast.courseId}`,
          severity: margin < 1.5 ? "critical" : "warning",
          type: "cliff",
          title: `${forecast.courseName} is ${margin.toFixed(1)}% above a ${currentThreshold.letter}`,
          detail: `One bad assignment could drop this grade to ${getLowerLetter(currentThreshold.letter)}.`,
          courseName: forecast.courseName,
          courseId: forecast.courseId,
          actionable: `Review recent scores and check for any upcoming high-weight assignments.`,
        });
      }
    }

    // UPCOMING RISK — high-weight category with few grades + upcoming work
    for (const trend of forecast.categoryTrends) {
      if (
        trend.weight >= 15 &&
        trend.gradedCount <= 2 &&
        trend.remainingCount > 0
      ) {
        const courseTodos = data.todos.filter(
          (t) => t.courseId === forecast.courseId && t.categoryName === trend.groupName
        );
        const nextDue = courseTodos
          .filter((t) => t.dueAt)
          .sort(
            (a, b) =>
              new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()
          )[0];

        if (nextDue) {
          const daysUntil = Math.ceil(
            (new Date(nextDue.dueAt!).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          );
          if (daysUntil > 0 && daysUntil <= 14) {
            alerts.push({
              id: `upcoming-${forecast.courseId}-${trend.groupId}`,
              severity: "warning",
              type: "upcoming_risk",
              title: `${trend.groupName} in ${forecast.courseName} — ${daysUntil} days to next assignment`,
              detail: `This category is worth ${trend.weight}% of the grade with only ${trend.gradedCount} score${trend.gradedCount !== 1 ? "s" : ""} so far (avg ${trend.averageScore.toFixed(0)}%). The next one carries heavy weight.`,
              courseName: forecast.courseName,
              courseId: forecast.courseId,
              actionable: `Start preparing for "${nextDue.assignmentName}" now — it's worth +${nextDue.gradeDelta.toFixed(1)}% of the course grade.`,
            });
          }
        }
      }
    }

    // CATEGORY DECLINE — category average below 70% with significant weight
    for (const trend of forecast.categoryTrends) {
      if (
        trend.gradedCount >= 3 &&
        trend.averageScore < 70 &&
        trend.weight >= 10
      ) {
        alerts.push({
          id: `decline-${forecast.courseId}-${trend.groupId}`,
          severity: "warning",
          type: "category_decline",
          title: `${trend.groupName} average is ${trend.averageScore.toFixed(0)}% in ${forecast.courseName}`,
          detail: `This category is worth ${trend.weight}% of the grade. The ${trend.gradedCount} scores so far average below 70%.`,
          courseName: forecast.courseName,
          courseId: forecast.courseId,
          actionable: `Consider reviewing study habits for ${trend.groupName.toLowerCase()} or asking the teacher about extra credit/retakes.`,
        });
      }
    }
  }

  // MISSING STREAK — multiple missing in same course
  const missingByCourse = new Map<string, number>();
  for (const todo of data.todos) {
    if (todo.status === "missing") {
      missingByCourse.set(
        todo.courseId,
        (missingByCourse.get(todo.courseId) ?? 0) + 1
      );
    }
  }
  for (const [courseId, count] of missingByCourse) {
    if (count >= 3) {
      const courseName =
        data.todos.find((t) => t.courseId === courseId)?.courseName ?? "";
      alerts.push({
        id: `streak-${courseId}`,
        severity: "critical",
        type: "missing_streak",
        title: `${count} missing assignments in ${courseName}`,
        detail: `Multiple zeros are compounding the grade damage. Each one completed recovers points.`,
        courseName,
        courseId,
        actionable: `Prioritize the highest-impact missing assignment first — even partial credit helps.`,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return alerts;
}

function getLowerLetter(letter: string): string {
  const idx = LETTER_GRADES.findIndex((lg) => lg.letter === letter);
  if (idx >= 0 && idx < LETTER_GRADES.length - 1) {
    return LETTER_GRADES[idx + 1].letter;
  }
  return letter;
}

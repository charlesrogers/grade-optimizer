import {
  Course,
  WorkloadAssignment,
  WorkloadPeriod,
  WorkloadRadar,
} from "./types";
import { gradableAssignments, simulateAssignmentCompletion } from "./grade-engine";
import { estimateEffort } from "./effort-estimator";

/**
 * Get end-of-day Sunday for a given date's week.
 */
function endOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of next Monday after a given date.
 */
function startOfNextWeek(date: Date): Date {
  const end = endOfWeek(date);
  const d = new Date(end);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generate workload radar: upcoming assignments bucketed by time period.
 */
export function generateWorkloadRadar(
  courses: Course[],
  expectedScorePercent: number = 85
): WorkloadRadar {
  const now = new Date();
  const thisWeekEnd = endOfWeek(now);
  const nextWeekStart = startOfNextWeek(now);
  const nextWeekEnd = endOfWeek(nextWeekStart);

  const assignments: WorkloadAssignment[] = [];

  for (const course of courses) {
    for (const group of course.assignmentGroups) {
      const gradable = gradableAssignments(group.assignments);
      const gradedCount = gradable.filter((a) => a.score !== null).length;

      for (const a of gradable) {
        // Only future, ungraded assignments with due dates
        if (a.score !== null) continue;
        if (!a.dueAt) continue;

        const dueDate = new Date(a.dueAt);
        if (dueDate <= now) continue; // past due = not "upcoming"

        const { gradeDelta } = simulateAssignmentCompletion(
          course,
          a.id,
          expectedScorePercent
        );

        const effort = estimateEffort(a.name, a.pointsPossible);
        const isHighImpact = group.weight >= 15 && gradedCount <= 2;

        assignments.push({
          assignmentId: a.id,
          assignmentName: a.name,
          courseName: course.name,
          courseId: course.id,
          categoryName: group.name,
          categoryWeight: group.weight,
          dueAt: a.dueAt,
          pointsPossible: a.pointsPossible,
          estimatedEffort: effort,
          gradeImpact: Math.round(gradeDelta * 100) / 100,
          isHighImpact,
          htmlUrl: a.htmlUrl,
        });
      }
    }
  }

  // Bucket into periods
  const thisWeek: WorkloadAssignment[] = [];
  const nextWeek: WorkloadAssignment[] = [];
  const later: WorkloadAssignment[] = [];

  for (const a of assignments) {
    const due = new Date(a.dueAt);
    if (due <= thisWeekEnd) {
      thisWeek.push(a);
    } else if (due <= nextWeekEnd) {
      nextWeek.push(a);
    } else {
      later.push(a);
    }
  }

  // Sort each bucket by grade impact descending
  const sortByImpact = (a: WorkloadAssignment, b: WorkloadAssignment) =>
    b.gradeImpact - a.gradeImpact;
  thisWeek.sort(sortByImpact);
  nextWeek.sort(sortByImpact);
  later.sort(sortByImpact);

  function makePeriod(
    label: string,
    items: WorkloadAssignment[]
  ): WorkloadPeriod {
    return {
      label,
      assignments: items,
      totalEffort: items.reduce((s, a) => s + a.estimatedEffort, 0),
      totalGradeImpact:
        Math.round(items.reduce((s, a) => s + a.gradeImpact, 0) * 100) / 100,
    };
  }

  const periods = [
    makePeriod("This Week", thisWeek),
    makePeriod("Next Week", nextWeek),
    makePeriod("Later", later),
  ];

  return {
    periods,
    totalUpcoming: assignments.length,
    totalEffort: assignments.reduce((s, a) => s + a.estimatedEffort, 0),
    highImpactCount: assignments.filter((a) => a.isHighImpact).length,
  };
}

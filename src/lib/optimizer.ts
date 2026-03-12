import {
  Course,
  GradeBreakdown,
  TodoItem,
  LETTER_GRADES,
} from "./types";
import {
  simulateAssignmentCompletion,
  findThresholdCrossing,
  calculateGradeBreakdown,
} from "./grade-engine";
import { estimateEffort } from "./effort-estimator";

/**
 * Determine assignment status
 */
function getStatus(
  missing: boolean,
  late: boolean,
  dueAt: string | null
): "missing" | "late" | "upcoming" {
  if (missing && dueAt && new Date(dueAt) < new Date()) return "missing";
  if (late) return "late";
  return "upcoming";
}

/**
 * Classify priority based on status, due date, and grade impact
 */
function classifyPriority(
  status: "missing" | "late" | "upcoming",
  dueAt: string | null,
  gradeDelta: number
): "critical" | "high" | "medium" | "low" {
  const now = new Date();
  const due = dueAt ? new Date(dueAt) : null;
  const hoursUntilDue = due ? (due.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity;
  const isPastDue = due ? due < now : false;

  if ((status === "missing" || isPastDue) && gradeDelta > 2) return "critical";
  if (hoursUntilDue <= 48 || gradeDelta > 1.5) return "high";
  if (hoursUntilDue <= 168 && gradeDelta > 0.5) return "medium"; // 7 days
  return "low";
}

/**
 * Generate prioritized to-do list from courses.
 *
 * Finds all improvable assignments (missing, unsubmitted, late),
 * calculates the grade impact of completing each one,
 * and sorts by efficiency (grade delta per hour of effort).
 */
export function generateTodoList(
  courses: Course[],
  expectedScorePercent: number = 85
): TodoItem[] {
  const todos: TodoItem[] = [];

  for (const course of courses) {
    const breakdown = calculateGradeBreakdown(course);

    for (const group of course.assignmentGroups) {
      for (const assignment of group.assignments) {
        // Skip graded, excused, or omitted assignments
        if (assignment.score !== null) continue;
        if (assignment.excused) continue;
        if (assignment.omitFromFinalGrade) continue;
        if (assignment.pointsPossible <= 0) continue;

        // Calculate grade impact of completing this assignment
        const { newGrade, gradeDelta } = simulateAssignmentCompletion(
          course,
          assignment.id,
          expectedScorePercent
        );

        if (gradeDelta <= 0) continue; // skip if no improvement possible

        const effort = estimateEffort(assignment.name, assignment.pointsPossible);
        const efficiency = effort > 0 ? gradeDelta / (effort / 60) : 0;

        const status = getStatus(
          assignment.missing,
          assignment.late,
          assignment.dueAt
        );

        const thresholdCrossing = findThresholdCrossing(
          breakdown.currentGrade,
          newGrade
        );

        todos.push({
          assignmentId: assignment.id,
          assignmentName: assignment.name,
          courseName: course.name,
          courseId: course.id,
          categoryName: group.name,
          categoryWeight: group.weight,
          dueAt: assignment.dueAt,
          pointsPossible: assignment.pointsPossible,
          gradeDelta: Math.round(gradeDelta * 100) / 100,
          estimatedEffort: effort,
          efficiency: Math.round(efficiency * 100) / 100,
          priority: classifyPriority(status, assignment.dueAt, gradeDelta),
          status,
          htmlUrl: assignment.htmlUrl,
          thresholdCrossing,
        });
      }
    }
  }

  // Sort: critical first, then by efficiency within each priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  todos.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.efficiency - a.efficiency; // higher efficiency first
  });

  return todos;
}

/**
 * Calculate overall GPA from grade breakdowns
 */
export function calculateOverallGPA(breakdowns: GradeBreakdown[]): number {
  if (breakdowns.length === 0) return 0;

  let totalGPA = 0;
  for (const b of breakdowns) {
    const gpaEntry = LETTER_GRADES.find((lg) => b.currentGrade >= lg.min);
    totalGPA += gpaEntry?.gpa ?? 0;
  }

  return Math.round((totalGPA / breakdowns.length) * 100) / 100;
}

/**
 * Calculate max potential GPA if all missing work is completed
 */
export function calculateMaxPotentialGPA(
  courses: Course[],
  expectedScorePercent: number = 85
): number {
  if (courses.length === 0) return 0;

  let totalGPA = 0;

  for (const course of courses) {
    // Simulate completing all missing assignments
    let modifiedGroups = course.assignmentGroups.map((group) => ({
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
            score: a.pointsPossible * (expectedScorePercent / 100),
            submitted: true,
            missing: false,
          };
        }
        return a;
      }),
    }));

    const modifiedCourse: Course = { ...course, assignmentGroups: modifiedGroups };
    const breakdown = calculateGradeBreakdown(modifiedCourse);
    const gpaEntry = LETTER_GRADES.find((lg) => breakdown.currentGrade >= lg.min);
    totalGPA += gpaEntry?.gpa ?? 0;
  }

  return Math.round((totalGPA / courses.length) * 100) / 100;
}

/**
 * Generate a human-readable summary that tells a story, not just stats.
 */
export function generateSummary(
  todos: TodoItem[],
  currentGPA: number,
  maxGPA: number
): string {
  const totalMissing = todos.filter((t) => t.status === "missing").length;
  const critical = todos.filter((t) => t.priority === "critical").length;
  const gpaDiff = Math.round((maxGPA - currentGPA) * 100) / 100;

  if (todos.length === 0) {
    return `All caught up — ${currentGPA.toFixed(2)} GPA with nothing overdue. Keep the momentum going.`;
  }

  if (critical > 0 && gpaDiff > 0.1) {
    return `${critical} overdue assignment${critical > 1 ? "s are" : " is"} costing you right now. Finishing all missing work could push your GPA from ${currentGPA.toFixed(2)} to ${maxGPA.toFixed(2)}.`;
  }

  if (totalMissing > 0 && gpaDiff > 0) {
    return `${totalMissing} missing assignment${totalMissing > 1 ? "s" : ""} = ${totalMissing > 1 ? `${totalMissing} zeros` : "a zero"} in the gradebook. Your GPA could be ${maxGPA.toFixed(2)} instead of ${currentGPA.toFixed(2)}.`;
  }

  const top = todos[0];
  return `No emergencies, but "${top.assignmentName}" in ${top.courseName} is your biggest opportunity right now (+${top.gradeDelta}%).`;
}

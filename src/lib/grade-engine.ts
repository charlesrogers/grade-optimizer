import {
  Assignment,
  AssignmentGroup,
  CategoryBreakdown,
  Course,
  GradeBreakdown,
  LETTER_GRADES,
} from "./types";

/**
 * Get letter grade for a numeric score
 */
export function getLetterGrade(score: number): string {
  for (const { min, letter } of LETTER_GRADES) {
    if (score >= min) return letter;
  }
  return "F";
}

/**
 * Get GPA value for a numeric score
 */
export function getGPA(score: number): number {
  for (const { min, gpa } of LETTER_GRADES) {
    if (score >= min) return gpa;
  }
  return 0.0;
}

/**
 * Find the next letter grade threshold above the current score.
 * Returns null if already at A.
 */
export function getNextThreshold(
  score: number
): { letter: string; min: number } | null {
  for (let i = LETTER_GRADES.length - 1; i >= 0; i--) {
    if (LETTER_GRADES[i].min > score) {
      return LETTER_GRADES[i];
    }
  }
  return null;
}

// === Internal: filter assignments for grade calculation ===

export function gradableAssignments(assignments: Assignment[]): Assignment[] {
  return assignments.filter(
    (a) => !a.excused && !a.omitFromFinalGrade && a.pointsPossible > 0
  );
}

/**
 * Apply drop rules to a sorted list of assignments.
 * Returns the assignments that count toward the grade (after drops).
 */
function applyDropRules(
  assignments: Assignment[],
  rules: { dropLowest: number; dropHighest: number; neverDrop: string[] }
): { kept: Assignment[]; dropped: Assignment[] } {
  if (
    assignments.length === 0 ||
    (rules.dropLowest === 0 && rules.dropHighest === 0)
  ) {
    return { kept: [...assignments], dropped: [] };
  }

  // Only drop from graded assignments (those with scores)
  const graded = assignments.filter((a) => a.score !== null);
  const ungraded = assignments.filter((a) => a.score === null);

  if (graded.length === 0) {
    return { kept: [...assignments], dropped: [] };
  }

  // Sort by score/possible ratio (ascending) for drop-lowest
  const sorted = [...graded].sort((a, b) => {
    const ratioA = a.pointsPossible > 0 ? (a.score ?? 0) / a.pointsPossible : 0;
    const ratioB = b.pointsPossible > 0 ? (b.score ?? 0) / b.pointsPossible : 0;
    return ratioA - ratioB;
  });

  const dropped: Assignment[] = [];
  const neverDropSet = new Set(rules.neverDrop);

  // Drop lowest
  let droppedLowest = 0;
  for (const a of sorted) {
    if (droppedLowest >= rules.dropLowest) break;
    if (neverDropSet.has(a.id)) continue;
    dropped.push(a);
    droppedLowest++;
  }

  // Drop highest (from the end of sorted = highest scores)
  let droppedHighest = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (droppedHighest >= rules.dropHighest) break;
    const a = sorted[i];
    if (neverDropSet.has(a.id) || dropped.includes(a)) continue;
    dropped.push(a);
    droppedHighest++;
  }

  const droppedSet = new Set(dropped.map((a) => a.id));
  const kept = [...graded.filter((a) => !droppedSet.has(a.id)), ...ungraded];

  return { kept, dropped };
}

// === Category grade calculation ===

interface CategoryResult {
  earned: number;
  possible: number;
  grade: number; // 0-100
  missingCount: number;
  droppedCount: number;
}

function calculateCategoryGrade(
  group: AssignmentGroup,
  countMissingAsZero: boolean
): CategoryResult {
  const gradable = gradableAssignments(group.assignments);
  const { kept, dropped } = applyDropRules(gradable, group.rules);

  let earned = 0;
  let possible = 0;
  let missingCount = 0;

  for (const a of kept) {
    if (a.score !== null) {
      // Has a score (graded)
      earned += a.score;
      possible += a.pointsPossible;
    } else if (a.missing || countMissingAsZero) {
      // Missing/unsubmitted: count as 0 if projecting, skip if current
      if (countMissingAsZero) {
        earned += 0;
        possible += a.pointsPossible;
      }
      missingCount++;
    } else {
      missingCount++;
    }
  }

  const grade = possible > 0 ? (earned / possible) * 100 : 0;

  return {
    earned,
    possible,
    grade,
    missingCount,
    droppedCount: dropped.length,
  };
}

// === Weighted course grade ===

interface CourseGradeResult {
  grade: number;
  categories: CategoryBreakdown[];
}

function calculateWeightedGrade(
  groups: AssignmentGroup[],
  countMissingAsZero: boolean
): CourseGradeResult {
  const categories: CategoryBreakdown[] = [];
  let totalWeightedScore = 0;
  let totalActiveWeight = 0;

  // Check if the course uses weighted grading
  const isWeighted = groups.some((g) => g.weight > 0);

  for (const group of groups) {
    const result = calculateCategoryGrade(group, countMissingAsZero);

    // A category is "active" if it has any graded assignments
    // (or any assignments at all when counting missing as zero)
    const hasGradedWork = countMissingAsZero
      ? gradableAssignments(group.assignments).length > 0
      : group.assignments.some(
          (a) =>
            a.score !== null && !a.excused && !a.omitFromFinalGrade
        );

    if (isWeighted) {
      if (hasGradedWork && result.possible > 0) {
        totalWeightedScore += result.grade * (group.weight / 100);
        totalActiveWeight += group.weight / 100;
      }
    } else {
      // Unweighted: just sum all points
      totalWeightedScore += result.earned;
      totalActiveWeight += result.possible;
    }

    categories.push({
      groupId: group.id,
      groupName: group.name,
      weight: group.weight,
      earned: result.earned,
      possible: result.possible,
      categoryGrade: result.grade,
      missingCount: result.missingCount,
      droppedCount: result.droppedCount,
    });
  }

  let grade: number;
  if (isWeighted) {
    // Renormalize: divide by sum of active weights
    grade = totalActiveWeight > 0 ? totalWeightedScore / totalActiveWeight * 100 : 0;
  } else {
    // Unweighted: total earned / total possible
    grade = totalActiveWeight > 0 ? (totalWeightedScore / totalActiveWeight) * 100 : 0;
  }

  return { grade, categories };
}

// === Public API ===

/**
 * Calculate full grade breakdown for a course.
 */
export function calculateGradeBreakdown(course: Course): GradeBreakdown {
  const current = calculateWeightedGrade(course.assignmentGroups, false);
  const projected = calculateWeightedGrade(course.assignmentGroups, true);

  const totalMissing = current.categories.reduce(
    (sum, c) => sum + c.missingCount,
    0
  );

  return {
    courseId: course.id,
    courseName: course.name,
    currentGrade: Math.round(current.grade * 100) / 100,
    projectedGrade: Math.round(projected.grade * 100) / 100,
    letterGrade: getLetterGrade(current.grade),
    projectedLetterGrade: getLetterGrade(projected.grade),
    categoryBreakdowns: current.categories,
    missingCount: totalMissing,
    potentialGain:
      Math.round((current.grade - projected.grade) * 100) / 100,
  };
}

/**
 * What-if simulation: calculate grade delta if a specific assignment
 * were completed with a given score.
 */
export function simulateAssignmentCompletion(
  course: Course,
  assignmentId: string,
  expectedScorePercent: number = 85
): { newGrade: number; gradeDelta: number } {
  // Deep clone the course with the assignment score modified
  const modifiedGroups: AssignmentGroup[] = course.assignmentGroups.map(
    (group) => ({
      ...group,
      assignments: group.assignments.map((a) => {
        if (a.id === assignmentId) {
          return {
            ...a,
            score: a.pointsPossible * (expectedScorePercent / 100),
            submitted: true,
            missing: false,
          };
        }
        return a;
      }),
    })
  );

  const currentResult = calculateWeightedGrade(
    course.assignmentGroups,
    false
  );
  const simulatedResult = calculateWeightedGrade(modifiedGroups, false);

  const newGrade = Math.round(simulatedResult.grade * 100) / 100;
  const gradeDelta =
    Math.round((simulatedResult.grade - currentResult.grade) * 100) / 100;

  return { newGrade, gradeDelta };
}

/**
 * Find which letter grade threshold an assignment completion would cross.
 */
export function findThresholdCrossing(
  currentGrade: number,
  newGrade: number
): string | undefined {
  const currentLetter = getLetterGrade(currentGrade);
  const newLetter = getLetterGrade(newGrade);
  if (currentLetter !== newLetter) {
    return `${currentLetter} → ${newLetter}`;
  }
  return undefined;
}

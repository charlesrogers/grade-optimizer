import {
  GradeOptimizerResponse,
  GradeSnapshot,
  GradeDelta,
  AssignmentChange,
} from "./types";

const STORAGE_KEY = "grade-optimizer-snapshots";
const MAX_SNAPSHOTS_PER_STUDENT = 10;

/**
 * Save a grade snapshot to localStorage.
 * Keeps last N snapshots per student.
 */
export function saveSnapshot(
  studentId: string,
  data: GradeOptimizerResponse
): void {
  if (typeof window === "undefined") return;

  const snapshot: GradeSnapshot = {
    timestamp: new Date().toISOString(),
    studentId,
    overallGPA: data.overallGPA,
    totalMissing: data.totalMissing,
    courses: data.courses.map((c) => ({
      courseId: c.courseId,
      courseName: c.courseName,
      currentGrade: c.currentGrade,
      letterGrade: c.letterGrade,
      missingCount: c.missingCount,
    })),
    assignments: data.assignmentSummaries ?? [],
  };

  try {
    const all = getAllSnapshots();
    const studentSnapshots = all.filter((s) => s.studentId === studentId);
    const otherSnapshots = all.filter((s) => s.studentId !== studentId);

    // Don't save if last snapshot was less than 1 hour ago
    if (studentSnapshots.length > 0) {
      const latest = studentSnapshots[studentSnapshots.length - 1];
      const elapsed =
        Date.now() - new Date(latest.timestamp).getTime();
      if (elapsed < 60 * 60 * 1000) return; // less than 1 hour
    }

    // Keep only last N snapshots
    const trimmed = studentSnapshots.slice(
      -(MAX_SNAPSHOTS_PER_STUDENT - 1)
    );
    trimmed.push(snapshot);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...otherSnapshots, ...trimmed])
    );
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Get all snapshots from localStorage.
 */
function getAllSnapshots(): GradeSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get all snapshots for a student, sorted by timestamp ascending.
 */
export function getSnapshotHistory(studentId: string): GradeSnapshot[] {
  return getAllSnapshots()
    .filter((s) => s.studentId === studentId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Get the most recent previous snapshot for a student (not the current one).
 */
export function getPreviousSnapshot(
  studentId: string
): GradeSnapshot | null {
  const all = getAllSnapshots().filter((s) => s.studentId === studentId);
  // Return second-to-last if we have at least 2, otherwise the only one
  // (since we save BEFORE computing delta, the latest is the previous state)
  if (all.length === 0) return null;
  // If we have multiple, return the most recent one (which represents the
  // state from last visit since we haven't saved yet for this visit)
  return all[all.length - 1];
}

/**
 * Compute the diff between current data and the last snapshot.
 */
export function computeDelta(
  studentId: string,
  studentName: string,
  current: GradeOptimizerResponse
): GradeDelta | null {
  const prev = getPreviousSnapshot(studentId);
  if (!prev) return null;

  const snapshotAge = formatTimeAgo(prev.timestamp);

  const gpaChange =
    Math.round((current.overallGPA - prev.overallGPA) * 100) / 100;
  const missingChange = current.totalMissing - prev.totalMissing;

  const courseChanges: GradeDelta["courseChanges"] = [];

  for (const currentCourse of current.courses) {
    const prevCourse = prev.courses.find(
      (c) => c.courseId === currentCourse.courseId
    );
    if (!prevCourse) continue;

    const gradeChange =
      Math.round(
        (currentCourse.currentGrade - prevCourse.currentGrade) * 10
      ) / 10;
    const mcChange =
      currentCourse.missingCount - prevCourse.missingCount;

    // Only include courses with meaningful changes
    if (Math.abs(gradeChange) >= 0.5 || mcChange !== 0) {
      courseChanges.push({
        courseId: currentCourse.courseId,
        courseName: currentCourse.courseName,
        gradeChange,
        oldGrade: prevCourse.currentGrade,
        newGrade: currentCourse.currentGrade,
        oldLetter: prevCourse.letterGrade,
        newLetter: currentCourse.letterGrade,
        missingChange: mcChange,
        newMissing: [],
      });
    }
  }

  // Compute assignment-level changes
  const assignmentChanges = computeAssignmentDelta(
    prev.assignments ?? [],
    current.assignmentSummaries ?? []
  );

  // Populate newMissing on course changes from assignment data
  for (const cc of courseChanges) {
    cc.newMissing = assignmentChanges
      .filter((ac) => ac.courseId === cc.courseId && ac.changeType === "newly_missing")
      .map((ac) => ac.assignmentName);
  }

  // If nothing changed meaningfully, return null
  if (
    Math.abs(gpaChange) < 0.01 &&
    missingChange === 0 &&
    courseChanges.length === 0 &&
    assignmentChanges.length === 0
  ) {
    return null;
  }

  return {
    studentId,
    studentName,
    snapshotAge,
    gpaChange: Math.abs(gpaChange) >= 0.01 ? gpaChange : null,
    missingChange: missingChange !== 0 ? missingChange : null,
    courseChanges,
    assignmentChanges: assignmentChanges.length > 0 ? assignmentChanges : undefined,
  };
}

/**
 * Diff assignment arrays between two snapshots.
 */
function computeAssignmentDelta(
  prevAssignments: GradeSnapshot["assignments"],
  currentAssignments: GradeOptimizerResponse["assignmentSummaries"]
): AssignmentChange[] {
  if (!prevAssignments?.length || !currentAssignments?.length) return [];

  const changes: AssignmentChange[] = [];
  const prevMap = new Map(prevAssignments.map((a) => [a.assignmentId, a]));

  for (const curr of currentAssignments) {
    const prev = prevMap.get(curr.assignmentId);
    if (!prev) continue;

    // Newly graded: was null, now has score
    if (prev.score === null && curr.score !== null) {
      changes.push({
        assignmentId: curr.assignmentId,
        assignmentName: curr.assignmentName,
        courseId: curr.courseId,
        courseName: curr.courseName,
        changeType: "graded",
        oldScore: null,
        newScore: curr.score,
      });
    }
    // Score changed
    else if (prev.score !== null && curr.score !== null && Math.abs(prev.score - curr.score) >= 0.5) {
      changes.push({
        assignmentId: curr.assignmentId,
        assignmentName: curr.assignmentName,
        courseId: curr.courseId,
        courseName: curr.courseName,
        changeType: "score_changed",
        oldScore: prev.score,
        newScore: curr.score,
      });
    }

    // Missing status changes
    if (!prev.missing && curr.missing) {
      changes.push({
        assignmentId: curr.assignmentId,
        assignmentName: curr.assignmentName,
        courseId: curr.courseId,
        courseName: curr.courseName,
        changeType: "newly_missing",
        oldScore: prev.score,
        newScore: curr.score,
      });
    } else if (prev.missing && !curr.missing) {
      changes.push({
        assignmentId: curr.assignmentId,
        assignmentName: curr.assignmentName,
        courseId: curr.courseId,
        courseName: curr.courseName,
        changeType: "no_longer_missing",
        oldScore: prev.score,
        newScore: curr.score,
      });
    }
  }

  return changes;
}

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
}

import { CanvasApi } from "@kth/canvas-api";
import {
  CanvasConfig,
  Course,
  AssignmentGroup,
  Assignment,
  Student,
  Term,
} from "./types";

/**
 * Create a Canvas API client from config.
 */
function createClient(config: CanvasConfig): CanvasApi {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  return new CanvasApi(`${baseUrl}/api/v1`, config.accessToken);
}

/**
 * Validate a Canvas token by fetching the current user profile.
 */
export async function validateToken(
  config: CanvasConfig
): Promise<{ valid: boolean; user?: Student; error?: string }> {
  try {
    const client = createClient(config);
    const response = await client.get("users/self");
    const user = response.body as Record<string, unknown>;
    return {
      valid: true,
      user: {
        id: String(user.id),
        name: String(user.name || user.short_name || "Unknown"),
        source: "canvas",
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Invalid token",
    };
  }
}

/**
 * Fetch observees (children linked to a parent/observer account).
 */
export async function fetchObservees(
  config: CanvasConfig
): Promise<Student[]> {
  const client = createClient(config);
  const students: Student[] = [];

  try {
    const items = client.listItems("users/self/observees");
    for await (const item of items) {
      const user = item as Record<string, unknown>;
      students.push({
        id: String(user.id),
        name: String(user.name || user.short_name || "Unknown"),
        source: "canvas",
      });
    }
  } catch {
    // Not an observer account, or no observees linked
  }

  return students;
}

/**
 * Fetch all active courses with enrollment scores.
 */
export async function fetchCourses(
  config: CanvasConfig,
  observedUserId?: string
): Promise<Course[]> {
  const client = createClient(config);
  const courses: Course[] = [];

  let endpoint = "courses?enrollment_state=active&include[]=total_scores&per_page=50";
  if (observedUserId) {
    endpoint += `&enrollment_type=observer`;
  }

  const items = client.listItems(endpoint);

  for await (const item of items) {
    const course = item as Record<string, unknown>;
    const enrollments = (course.enrollments as Record<string, unknown>[]) || [];

    // Find the relevant enrollment (student or observer)
    let currentScore: number | null = null;
    let finalScore: number | null = null;

    for (const enrollment of enrollments) {
      const grades = enrollment.grades as Record<string, unknown> | undefined;
      if (grades) {
        currentScore = (grades.current_score as number) ?? null;
        finalScore = (grades.final_score as number) ?? null;
        break;
      }
    }

    courses.push({
      id: String(course.id),
      name: String(course.name || "Unknown Course"),
      currentScore,
      finalScore,
      assignmentGroups: [], // populated next
      source: "canvas",
    });
  }

  // Fetch assignment groups + assignments for each course in parallel
  const groupPromises = courses.map((course) =>
    fetchAssignmentGroups(config, course.id, observedUserId)
  );
  const allGroups = await Promise.all(groupPromises);

  for (let i = 0; i < courses.length; i++) {
    courses[i].assignmentGroups = allGroups[i];
  }

  return courses;
}

/**
 * Fetch assignment groups with assignments and submissions for a course.
 * This is the key endpoint: one call per course gets groups + weights + assignments + scores.
 */
async function fetchAssignmentGroups(
  config: CanvasConfig,
  courseId: string,
  observedUserId?: string
): Promise<AssignmentGroup[]> {
  const client = createClient(config);

  let endpoint = `courses/${courseId}/assignment_groups?include[]=assignments&include[]=submission&per_page=50`;
  if (observedUserId) {
    endpoint += `&observed_user_id=${observedUserId}`;
  }

  const groups: AssignmentGroup[] = [];

  const items = client.listItems(endpoint);

  for await (const item of items) {
    const group = item as Record<string, unknown>;
    const rules = group.rules as Record<string, unknown> | undefined;
    const rawAssignments =
      (group.assignments as Record<string, unknown>[]) || [];

    const assignments: Assignment[] = rawAssignments.map((a) => {
      const submission = a.submission as Record<string, unknown> | undefined;
      const workflowState = submission?.workflow_state as string | undefined;
      const submittedAt = submission?.submitted_at as string | undefined;

      return {
        id: String(a.id),
        name: String(a.name || "Untitled"),
        dueAt: (a.due_at as string) || null,
        pointsPossible: (a.points_possible as number) || 0,
        score: (submission?.score as number) ?? null,
        submitted: workflowState === "submitted" || workflowState === "graded" || !!submittedAt,
        missing: (submission?.missing as boolean) || false,
        late: (submission?.late as boolean) || false,
        excused: (submission?.excused as boolean) || false,
        omitFromFinalGrade: (a.omit_from_final_grade as boolean) || false,
        assignmentGroupId: String(group.id),
        htmlUrl: (a.html_url as string) || undefined,
        submittedAt: submittedAt || null,
        secondsLate: (submission?.seconds_late as number) || 0,
      };
    });

    groups.push({
      id: String(group.id),
      name: String(group.name || "Unnamed Group"),
      weight: (group.group_weight as number) || 0,
      rules: {
        dropLowest: (rules?.drop_lowest as number) || 0,
        dropHighest: (rules?.drop_highest as number) || 0,
        neverDrop: ((rules?.never_drop as Record<string, unknown>[]) || []).map(
          (nd) => String(nd.id)
        ),
      },
      assignments,
    });
  }

  return groups;
}

/**
 * Fetch all historical + active courses with term info and final grades.
 * No assignment group fetching — just the course-level grade and term.
 */
export async function fetchHistoricalCourses(
  config: CanvasConfig,
  observedUserId?: string
): Promise<{ id: string; name: string; finalScore: number | null; currentScore: number | null; isActive: boolean; term: Term | null }[]> {
  const client = createClient(config);

  let endpoint = "courses?enrollment_state=active&enrollment_state=completed&include[]=total_scores&include[]=term&per_page=50";
  if (observedUserId) {
    endpoint += `&enrollment_type=observer`;
  }

  const results: { id: string; name: string; finalScore: number | null; currentScore: number | null; isActive: boolean; term: Term | null }[] = [];
  const items = client.listItems(endpoint);

  for await (const item of items) {
    const course = item as Record<string, unknown>;
    const enrollments = (course.enrollments as Record<string, unknown>[]) || [];

    let currentScore: number | null = null;
    let finalScore: number | null = null;
    let isActive = false;

    for (const enrollment of enrollments) {
      const state = enrollment.enrollment_state as string | undefined;
      if (state === "active") isActive = true;
      const grades = enrollment.grades as Record<string, unknown> | undefined;
      if (grades) {
        currentScore = (grades.current_score as number) ?? null;
        finalScore = (grades.final_score as number) ?? null;
        break;
      }
    }

    // Extract term
    const rawTerm = course.term as Record<string, unknown> | undefined;
    const term: Term | null = rawTerm
      ? {
          id: String(rawTerm.id),
          name: String(rawTerm.name || "Unknown Term"),
          startAt: (rawTerm.start_at as string) || null,
          endAt: (rawTerm.end_at as string) || null,
        }
      : null;

    // Filter out courses with no grades AND no term (sandbox/test courses)
    if (currentScore == null && finalScore == null && !term) continue;

    results.push({
      id: String(course.id),
      name: String(course.name || "Unknown Course"),
      finalScore,
      currentScore,
      isActive,
      term,
    });
  }

  return results;
}

/**
 * Fetch all missing submissions across all courses.
 * Useful for a quick count / cross-reference.
 */
export async function fetchMissingSubmissions(
  config: CanvasConfig,
  observedUserId?: string
): Promise<{ courseId: string; assignmentId: string; name: string; dueAt: string | null }[]> {
  const client = createClient(config);

  let endpoint = "users/self/missing_submissions?include[]=course&per_page=50";
  if (observedUserId) {
    endpoint = `users/${observedUserId}/missing_submissions?include[]=course&per_page=50`;
  }

  const missing: { courseId: string; assignmentId: string; name: string; dueAt: string | null }[] = [];

  const items = client.listItems(endpoint);

  for await (const item of items) {
    const a = item as Record<string, unknown>;
    missing.push({
      courseId: String(a.course_id),
      assignmentId: String(a.id),
      name: String(a.name || "Untitled"),
      dueAt: (a.due_at as string) || null,
    });
  }

  return missing;
}

import * as cheerio from "cheerio";
import {
  SkywardConfig,
  Course,
  AssignmentGroup,
  Assignment,
  Student,
} from "./types";

interface SkywardSession {
  cookies: string;
  config: SkywardConfig;
}

/**
 * Login to Skyward Family Access and get session cookies.
 */
async function login(config: SkywardConfig): Promise<SkywardSession> {
  const loginUrl = `${config.loginUrl}/skyloginp`;

  const formData = new URLSearchParams();
  formData.set("codeType", "tryLogin");
  formData.set("login", config.username);
  formData.set("password", config.password);

  const res = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
    redirect: "manual",
  });

  // Skyward returns session info in response or cookies
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookieString = setCookies
    .map((c) => c.split(";")[0])
    .join("; ");

  if (!cookieString) {
    // Try parsing response body for session data
    const body = await res.text();
    if (body.includes("Invalid") || body.includes("incorrect")) {
      throw new Error("Invalid Skyward credentials");
    }
    throw new Error("Failed to establish Skyward session");
  }

  return { cookies: cookieString, config };
}

/**
 * Fetch a page from Skyward with session cookies.
 */
async function fetchPage(
  session: SkywardSession,
  path: string
): Promise<string> {
  const url = `${session.config.loginUrl}/${path}`;

  const res = await fetch(url, {
    headers: {
      Cookie: session.cookies,
    },
    redirect: "follow",
  });

  const html = await res.text();

  // Detect session timeout (redirect to login)
  if (
    html.includes("loginp") ||
    html.includes("Your session has expired") ||
    html.includes("skyloginp")
  ) {
    throw new Error("SESSION_EXPIRED");
  }

  return html;
}

/**
 * Fetch page with automatic re-auth on session timeout.
 */
async function fetchPageWithRetry(
  session: SkywardSession,
  path: string
): Promise<{ html: string; session: SkywardSession }> {
  try {
    const html = await fetchPage(session, path);
    return { html, session };
  } catch (err) {
    if (err instanceof Error && err.message === "SESSION_EXPIRED") {
      // Re-authenticate
      const newSession = await login(session.config);
      const html = await fetchPage(newSession, path);
      return { html, session: newSession };
    }
    throw err;
  }
}

/**
 * Parse the Skyward gradebook HTML into normalized Course data.
 */
function parseGradebook(html: string): Course[] {
  const $ = cheerio.load(html);
  const courses: Course[] = [];

  // Skyward renders courses in table rows with class patterns
  // This is a generalized parser — may need district-specific adjustments
  $("table.sf_gridTableWrap, table[id*='grid'], .sf_gridTableWrap").each(
    (_, table) => {
      const rows = $(table).find("tr");

      rows.each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length < 3) return;

        const courseName = $(cells[0]).text().trim();
        if (!courseName || courseName === "Course") return;

        // Try to extract grade from cells
        const gradeText = $(cells).last().text().trim();
        const gradeMatch = gradeText.match(/(\d+\.?\d*)%?/);
        const currentScore = gradeMatch ? parseFloat(gradeMatch[1]) : null;

        if (courseName.length > 2) {
          courses.push({
            id: `skyward-${courses.length}`,
            name: courseName,
            currentScore,
            finalScore: currentScore,
            assignmentGroups: [],
            source: "skyward",
          });
        }
      });
    }
  );

  // If table parsing didn't work, try div-based layout
  if (courses.length === 0) {
    $("[id*='CourseGroup'], .courseGroup, [class*='course']").each(
      (i, el) => {
        const name =
          $(el).find("[class*='courseName'], .sf_gridTitle, th").first().text().trim() ||
          $(el).find("a").first().text().trim();

        if (!name) return;

        const gradeEl = $(el).find(
          "[class*='grade'], [class*='score'], [class*='pct']"
        );
        const gradeText = gradeEl.text().trim();
        const gradeMatch = gradeText.match(/(\d+\.?\d*)%?/);
        const currentScore = gradeMatch ? parseFloat(gradeMatch[1]) : null;

        courses.push({
          id: `skyward-${i}`,
          name,
          currentScore,
          finalScore: currentScore,
          assignmentGroups: [],
          source: "skyward",
        });
      }
    );
  }

  return courses;
}

/**
 * Parse assignment details for a course from Skyward HTML.
 */
function parseAssignments(
  html: string,
  courseId: string
): AssignmentGroup[] {
  const $ = cheerio.load(html);
  const groupsMap = new Map<string, AssignmentGroup>();

  // Skyward shows assignments in a table with category, name, score columns
  $("tr[class*='sf_gridRow'], tr.odd, tr.even, tbody tr").each((i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    // Try to extract: category, assignment name, score, possible
    const texts = cells.map((_, c) => $(c).text().trim()).get();

    // Look for score pattern like "85/100" or "85.0" or "M" (missing)
    let assignmentName = "";
    let category = "Assignments";
    let score: number | null = null;
    let pointsPossible = 0;
    let missing = false;

    for (const text of texts) {
      const scoreMatch = text.match(/^(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)$/);
      if (scoreMatch) {
        score = parseFloat(scoreMatch[1]);
        pointsPossible = parseFloat(scoreMatch[2]);
        continue;
      }
      if (text === "M" || text.toLowerCase() === "missing") {
        missing = true;
        continue;
      }
      if (
        text.length > 2 &&
        !text.match(/^\d/) &&
        !assignmentName
      ) {
        assignmentName = text;
      }
    }

    // Try to find category from a category header row or column
    const catEl = $(row).find("[class*='cat'], [class*='Cat']");
    if (catEl.length > 0) {
      category = catEl.text().trim() || category;
    }

    if (!assignmentName) return;

    if (!groupsMap.has(category)) {
      groupsMap.set(category, {
        id: `skyward-group-${groupsMap.size}`,
        name: category,
        weight: 0, // Skyward weight parsing needs district-specific logic
        rules: { dropLowest: 0, dropHighest: 0, neverDrop: [] },
        assignments: [],
      });
    }

    const group = groupsMap.get(category)!;
    group.assignments.push({
      id: `skyward-${courseId}-${i}`,
      name: assignmentName,
      dueAt: null, // Skyward doesn't always show due dates in gradebook
      pointsPossible: pointsPossible || 100,
      score,
      submitted: score !== null,
      missing,
      late: false,
      excused: false,
      omitFromFinalGrade: false,
      assignmentGroupId: group.id,
      submittedAt: null,
      secondsLate: 0,
    });
  });

  return Array.from(groupsMap.values());
}

// === Public API ===

/**
 * Validate Skyward credentials by attempting login.
 */
export async function validateSkywardCredentials(
  config: SkywardConfig
): Promise<{ valid: boolean; user?: Student; error?: string }> {
  try {
    const session = await login(config);
    // Try fetching the main page to confirm session works
    await fetchPage(session, "sfhome01.w");

    return {
      valid: true,
      user: {
        id: "skyward-user",
        name: config.username,
        source: "skyward",
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Invalid credentials",
    };
  }
}

/**
 * Fetch all courses with grades from Skyward.
 */
export async function fetchSkywardCourses(
  config: SkywardConfig
): Promise<Course[]> {
  let session = await login(config);

  // Fetch gradebook page
  const result = await fetchPageWithRetry(session, "sfgradebook001.w");
  session = result.session;

  const courses = parseGradebook(result.html);

  // For each course, try to fetch assignment details
  // Note: this is best-effort — Skyward's navigation varies by district
  for (const course of courses) {
    try {
      const detailResult = await fetchPageWithRetry(
        session,
        `sfgradebook001.w?course=${course.id}`
      );
      session = detailResult.session;
      course.assignmentGroups = parseAssignments(
        detailResult.html,
        course.id
      );
    } catch {
      // If we can't get assignment details, the course still has the overall grade
    }
  }

  return courses;
}

import { Course, LMSConfig, Term } from "./types";
import { fetchCourses as fetchCanvasCourses, fetchHistoricalCourses } from "./canvas-client";
import { fetchSkywardCourses } from "./skyward-client";

/**
 * Fetch courses from whatever LMS is configured.
 * Returns normalized Course[] regardless of source.
 */
export async function fetchCoursesFromConfig(
  config: LMSConfig,
  observedUserId?: string
): Promise<Course[]> {
  switch (config.type) {
    case "canvas":
      return fetchCanvasCourses(config.config, observedUserId);
    case "skyward":
      return fetchSkywardCourses(config.config);
    default:
      throw new Error("Unknown LMS type");
  }
}

/**
 * Fetch historical courses (all terms) from Canvas.
 */
export async function fetchHistoricalFromConfig(
  config: LMSConfig,
  observedUserId?: string
): Promise<{ id: string; name: string; finalScore: number | null; currentScore: number | null; isActive: boolean; term: Term | null }[]> {
  if (config.type !== "canvas") throw new Error("History requires Canvas");
  return fetchHistoricalCourses(config.config, observedUserId);
}

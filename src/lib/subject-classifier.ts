import type { SubjectCategory } from "./types";

const SUBJECT_KEYWORDS: [SubjectCategory, string[]][] = [
  ["CS/Tech", ["computer science", "computer", "programming", "coding", "web design", "digital", "technology"]],
  ["Math", ["math", "algebra", "geometry", "calculus", "calc", "pre-calc", "precalc", "trig", "statistics", "stats"]],
  ["English", ["english", "language arts", "ela", "literature", "writing", "composition", "reading"]],
  ["Science", ["science", "biology", "bio", "chemistry", "chem", "physics", "anatomy", "environmental", "earth"]],
  ["Social Studies", ["history", "government", "economics", "geography", "civics", "social studies"]],
  ["Languages", ["spanish", "french", "german", "chinese", "mandarin", "japanese", "latin", "asl"]],
  ["Arts", ["art", "music", "band", "orchestra", "choir", "theater", "theatre", "drama", "ceramics", "photography", "dance"]],
];

const STORAGE_KEY = "grade-optimizer-subject-overrides";

/**
 * Classify a course by its name into a subject category.
 * Strips common prefixes, then does case-insensitive keyword matching.
 */
export function classifyCourse(name: string): SubjectCategory {
  // Strip prefixes
  const stripped = name
    .replace(/^(AP|Honors|H|IB|Pre-AP)\s+/i, "")
    .toLowerCase()
    .trim();

  // Exact match for "CS"
  if (/\bcs\b/.test(stripped)) return "CS/Tech";

  for (const [category, keywords] of SUBJECT_KEYWORDS) {
    for (const kw of keywords) {
      if (stripped.includes(kw)) return category;
    }
  }

  return "Electives";
}

/**
 * Get manual subject overrides from localStorage.
 */
export function getOverrides(): Record<string, SubjectCategory> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Set a manual subject override for a course name.
 */
export function setOverride(courseName: string, category: SubjectCategory): void {
  if (typeof window === "undefined") return;
  try {
    const overrides = getOverrides();
    overrides[courseName] = category;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage unavailable
  }
}

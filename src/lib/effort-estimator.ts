/**
 * Estimate effort in minutes for an assignment based on points and name keywords.
 */

const TYPE_MULTIPLIERS: { pattern: RegExp; multiplier: number }[] = [
  { pattern: /\b(essay|paper|report|write|writing|composition)\b/i, multiplier: 2.0 },
  { pattern: /\b(project|presentation|portfolio)\b/i, multiplier: 1.8 },
  { pattern: /\b(lab|experiment|investigation)\b/i, multiplier: 1.5 },
  { pattern: /\b(exam|test|midterm|final)\b/i, multiplier: 1.3 },
  { pattern: /\b(reading|read)\b/i, multiplier: 0.8 },
  { pattern: /\b(discussion|forum|post|respond)\b/i, multiplier: 0.7 },
  { pattern: /\b(quiz|check|warm.?up|bell.?ringer|exit.?ticket)\b/i, multiplier: 0.5 },
  { pattern: /\b(attendance|participation|journal)\b/i, multiplier: 0.3 },
];

/**
 * Base effort from points possible using a log scale:
 *   10pts ≈ 30min, 50pts ≈ 75min, 100pts ≈ 105min, 200pts ≈ 135min
 */
function baseEffort(pointsPossible: number): number {
  if (pointsPossible <= 0) return 15;
  // Logarithmic scale: effort = 30 * ln(points/5 + 1)
  return Math.round(30 * Math.log(pointsPossible / 5 + 1));
}

/**
 * Get type multiplier from assignment name keywords.
 */
function getTypeMultiplier(assignmentName: string): number {
  for (const { pattern, multiplier } of TYPE_MULTIPLIERS) {
    if (pattern.test(assignmentName)) {
      return multiplier;
    }
  }
  return 1.0; // default: standard homework
}

/**
 * Estimate effort in minutes for completing an assignment.
 */
export function estimateEffort(
  assignmentName: string,
  pointsPossible: number
): number {
  const base = baseEffort(pointsPossible);
  const multiplier = getTypeMultiplier(assignmentName);
  return Math.max(10, Math.round(base * multiplier)); // minimum 10 minutes
}

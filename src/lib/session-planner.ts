import { TodoItem, SessionPlanItem, SessionPlan } from "./types";

/**
 * Generate a time-budgeted session plan from prioritized todos.
 * Greedy knapsack: picks items in priority/efficiency order until time runs out.
 * Runs client-side — no API call needed.
 */
export function generateSessionPlan(
  todos: TodoItem[],
  availableMinutes: number,
  currentGPA: number
): SessionPlan {
  const items: SessionPlanItem[] = [];
  let cumulativeTime = 0;
  let cumulativeGradeDelta = 0;

  // Todos are already sorted by priority then efficiency
  for (const todo of todos) {
    if (cumulativeTime + todo.estimatedEffort > availableMinutes) continue;

    cumulativeTime += todo.estimatedEffort;
    cumulativeGradeDelta += todo.gradeDelta;

    items.push({
      ...todo,
      cumulativeTime,
      cumulativeGradeDelta: Math.round(cumulativeGradeDelta * 100) / 100,
    });
  }

  // Approximate GPA boost: grade delta is in percentage points across courses
  // Convert to GPA scale (~10 percentage points ≈ 0.3-0.4 GPA)
  const gpaBoost = cumulativeGradeDelta * 0.035;

  return {
    availableMinutes,
    items,
    totalEffort: cumulativeTime,
    totalGradeDelta: Math.round(cumulativeGradeDelta * 100) / 100,
    projectedGPA: Math.round((currentGPA + gpaBoost) * 100) / 100,
    unusedMinutes: availableMinutes - cumulativeTime,
  };
}

import { TodoItem, ConversationScript, ConversationItem } from "./types";

/**
 * Generate parent-ready conversation scripts from todo items.
 * Groups by child (for family view) and provides specific talking points.
 */
export function generateConversationScripts(
  childName: string,
  todos: TodoItem[]
): ConversationScript {
  // Only include critical + high priority items — parents don't need to discuss low-priority stuff
  const actionable = todos.filter(
    (t) => t.priority === "critical" || t.priority === "high"
  );

  const items: ConversationItem[] = actionable.slice(0, 5).map((todo) => {
    const status = formatStatus(todo);
    const whyItMatters = formatImpact(todo);
    const suggestedApproach = formatApproach(todo);

    return {
      assignmentName: todo.assignmentName,
      courseName: todo.courseName,
      status,
      whyItMatters,
      suggestedApproach,
      priority: todo.priority,
    };
  });

  return { childName, items };
}

function formatStatus(todo: TodoItem): string {
  if (!todo.dueAt) {
    return todo.status === "missing" ? "missing (no due date)" : "upcoming";
  }

  const now = new Date();
  const due = new Date(todo.dueAt);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
  }
  if (diffDays === 0) return "due today";
  if (diffDays === 1) return "due tomorrow";
  return `due in ${diffDays} days`;
}

function formatImpact(todo: TodoItem): string {
  let impact = `+${todo.gradeDelta.toFixed(1)}% grade impact`;
  if (todo.thresholdCrossing) {
    impact += ` — could push ${todo.thresholdCrossing}`;
  }
  return impact;
}

function formatApproach(todo: TodoItem): string {
  const effort = todo.estimatedEffort;
  if (effort < 60) return `~${effort} min of work`;
  const h = Math.floor(effort / 60);
  const m = effort % 60;
  return m > 0 ? `~${h}h ${m}m of work` : `~${h}h of work`;
}

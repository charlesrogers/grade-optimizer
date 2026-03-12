"use client";

import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { TodoItem } from "@/lib/types";
import { generateSessionPlan } from "@/lib/session-planner";

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 ring-red-600/10",
  high: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 ring-amber-600/10",
  medium: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ring-blue-600/10",
  low: "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 ring-slate-600/10",
};

export function SessionPlanner({
  todos,
  currentGPA,
}: {
  todos: TodoItem[];
  currentGPA: number;
}) {
  const [availableMinutes, setAvailableMinutes] = useState(120);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  // Filter out completed items and regenerate plan
  const activeTodos = useMemo(
    () => todos.filter((t) => !completed.has(t.assignmentId)),
    [todos, completed]
  );

  const plan = useMemo(
    () => generateSessionPlan(activeTodos, availableMinutes, currentGPA),
    [activeTodos, availableMinutes, currentGPA]
  );

  function toggleComplete(assignmentId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
      }
      return next;
    });
  }

  function handleTimeChange(value: number | readonly number[]) {
    const v = Array.isArray(value) ? value[0] : value;
    setAvailableMinutes(v);
  }

  return (
    <div className="space-y-6">
      {/* Time input */}
      <div className="rounded-xl border bg-card px-5 py-4 shadow-sm shadow-black/[0.04]">
        <div className="flex items-center gap-5">
          <span className="text-[13px] text-muted-foreground whitespace-nowrap">
            I have
          </span>
          <Slider
            value={[availableMinutes]}
            onValueChange={handleTimeChange}
            min={30}
            max={240}
            step={15}
            className="flex-1 max-w-xs"
          />
          <span className="text-[15px] font-semibold tabular-nums w-16 text-right">
            {formatEffort(availableMinutes)}
          </span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-4 text-[13px]">
          <span className="font-semibold text-foreground">
            {plan.items.length} item{plan.items.length !== 1 ? "s" : ""}
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground">
            {formatEffort(plan.totalEffort)}
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="font-semibold text-emerald-600">
            +{plan.totalGradeDelta.toFixed(1)}% grade boost
          </span>
          {completed.size > 0 && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <span className="text-emerald-600 font-medium">
                {completed.size} done
              </span>
            </>
          )}
          {plan.unusedMinutes > 15 && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <span className="text-muted-foreground">
                {formatEffort(plan.unusedMinutes)} spare
              </span>
            </>
          )}
        </div>
        {plan.items.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            {completed.size === 0
              ? `Complete all ${plan.items.length} to boost your grades by +${plan.totalGradeDelta.toFixed(1)}% — do them in order for maximum impact`
              : `${plan.items.length - completed.size} remaining — keep going, every assignment counts`}
          </p>
        )}
      </div>

      {/* Checklist */}
      {plan.items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
          <p className="text-[14px] font-medium text-muted-foreground">
            No assignments fit in {formatEffort(availableMinutes)}
          </p>
          <p className="text-[12px] text-muted-foreground mt-1">
            The smallest assignment takes longer than your available time — try adding more minutes
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Column labels */}
          <div className="flex items-center gap-3 px-4 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span className="w-5" />
            <span className="w-5" />
            <span className="flex-1">Assignment</span>
            <span className="w-16" />
            <span className="w-12 text-right">Time</span>
            <span className="w-14 text-right">Impact</span>
            <span className="w-14 text-right">Total</span>
          </div>
          {plan.items.map((item, idx) => (
            <div
              key={item.assignmentId}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                completed.has(item.assignmentId)
                  ? "bg-muted/30 border-muted opacity-60"
                  : "bg-card hover:bg-muted/20"
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleComplete(item.assignmentId)}
                className={`h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  completed.has(item.assignmentId)
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-muted-foreground/30 hover:border-primary"
                }`}
              >
                {completed.has(item.assignmentId) && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Rank */}
              <span className="text-[12px] text-muted-foreground tabular-nums w-5 text-center flex-shrink-0">
                {idx + 1}
              </span>

              {/* Assignment info */}
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium truncate ${
                  completed.has(item.assignmentId) ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {item.assignmentName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {item.courseName}
                </p>
              </div>

              {/* Priority badge */}
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset flex-shrink-0 ${priorityColors[item.priority]}`}>
                {item.priority}
              </span>

              {/* Effort */}
              <span className="text-[12px] text-muted-foreground tabular-nums w-12 text-right flex-shrink-0">
                {formatEffort(item.estimatedEffort)}
              </span>

              {/* Grade delta */}
              <span className="text-[12px] font-semibold text-emerald-600 tabular-nums w-14 text-right flex-shrink-0">
                +{item.gradeDelta.toFixed(1)}%
              </span>

              {/* Cumulative */}
              <span className="text-[11px] text-muted-foreground tabular-nums w-14 text-right flex-shrink-0">
                +{item.cumulativeGradeDelta.toFixed(1)}%
              </span>

              {/* Threshold crossing */}
              {item.thresholdCrossing && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20 flex-shrink-0">
                  {item.thresholdCrossing}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed section */}
      {completed.size > 0 && (
        <div>
          <p className="text-[12px] font-medium text-muted-foreground mb-2">
            Completed ({completed.size})
          </p>
          <div className="space-y-1">
            {todos
              .filter((t) => completed.has(t.assignmentId))
              .map((item) => (
                <div
                  key={item.assignmentId}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900"
                >
                  <button
                    onClick={() => toggleComplete(item.assignmentId)}
                    className="h-5 w-5 rounded-md bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <span className="text-[13px] text-muted-foreground line-through truncate">
                    {item.assignmentName}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-auto flex-shrink-0">
                    {item.courseName}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

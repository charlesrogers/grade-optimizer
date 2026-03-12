"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { GradeImpactBar } from "@/components/grade-impact-bar";
import { TodoItem } from "@/lib/types";

const priorityConfig: Record<
  string,
  { label: string; dot: string; bg: string; text: string }
> = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
  },
  high: {
    label: "High",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
  },
  medium: {
    label: "Medium",
    dot: "bg-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
  },
  low: {
    label: "Low",
    dot: "bg-slate-400",
    bg: "bg-slate-50 dark:bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
  },
};

function formatDueDate(dueAt: string | null): { text: string; urgent: boolean } {
  if (!dueAt) return { text: "No due date", urgent: false };
  const date = new Date(dueAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < -1)
    return { text: `${Math.abs(diffDays)}d overdue`, urgent: true };
  if (diffDays === -1) return { text: "Yesterday", urgent: true };
  if (diffDays === 0) return { text: "Today", urgent: true };
  if (diffDays === 1) return { text: "Tomorrow", urgent: true };
  if (diffDays <= 7) return { text: `${diffDays} days`, urgent: false };

  return {
    text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgent: false,
  };
}

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function TodoList({
  todos,
  courses,
}: {
  todos: TodoItem[];
  courses: string[];
}) {
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [timeBudget, setTimeBudget] = useState<string>("");

  const maxDelta = useMemo(
    () => Math.max(...todos.map((t) => t.gradeDelta), 0.1),
    [todos]
  );

  const filtered = useMemo(() => {
    let result = [...todos];

    if (courseFilter !== "all") {
      result = result.filter((t) => t.courseName === courseFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (timeBudget) {
      const budgetMinutes = Number(timeBudget) * 60;
      if (budgetMinutes > 0) {
        const selected: TodoItem[] = [];
        let remaining = budgetMinutes;
        for (const item of result) {
          if (item.estimatedEffort <= remaining) {
            selected.push(item);
            remaining -= item.estimatedEffort;
          }
        }
        result = selected;
      }
    }

    return result;
  }, [todos, courseFilter, priorityFilter, timeBudget]);

  const totalEffort = filtered.reduce((sum, t) => sum + t.estimatedEffort, 0);
  const totalDelta = filtered.reduce((sum, t) => sum + t.gradeDelta, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Course
          </label>
          <Select
            value={courseFilter}
            onValueChange={(v) => setCourseFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[200px] h-8 text-[13px]">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Priority
          </label>
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v ?? "all")}
          >
            <SelectTrigger className="w-[140px] h-8 text-[13px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Time budget
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="hours"
              value={timeBudget}
              onChange={(e) => setTimeBudget(e.target.value)}
              className="w-[100px] h-8 text-[13px] pr-8"
              min="0"
              step="0.5"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
              hr
            </span>
          </div>
        </div>

        {filtered.length > 0 && (
          <div className="ml-auto flex items-center gap-3 text-[13px] text-muted-foreground">
            <span>{filtered.length} items</span>
            <span className="text-border">|</span>
            <span>{formatEffort(totalEffort)}</span>
            <span className="text-border">|</span>
            <span className="text-emerald-600 font-medium">
              +{totalDelta.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card text-center py-16 shadow-sm">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-muted-foreground"
            >
              <path
                d="M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className="text-[15px] font-medium">
            {todos.length === 0
              ? "You're all caught up!"
              : "No assignments match your filters"}
          </p>
          <p className="text-[13px] text-muted-foreground mt-1">
            {todos.length === 0
              ? "No missing or actionable assignments found."
              : "Try adjusting your filters above."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2rem_1fr_140px_80px_130px_80px_70px_90px] gap-3 px-4 py-2.5 border-b bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            <div>#</div>
            <div>Assignment</div>
            <div>Course</div>
            <div className="text-right">Points</div>
            <div>Impact</div>
            <div>Effort</div>
            <div>Due</div>
            <div>Priority</div>
          </div>

          {/* Rows */}
          <TodoRows filtered={filtered} maxDelta={maxDelta} />
        </div>
      )}
    </div>
  );
}

function TodoRows({
  filtered,
  maxDelta,
}: {
  filtered: TodoItem[];
  maxDelta: number;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [whatIfScores, setWhatIfScores] = useState<Record<string, number>>({});

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleWhatIfChange = useCallback(
    (id: string, value: number | readonly number[]) => {
      const v = Array.isArray(value) ? value[0] : value;
      setWhatIfScores((prev) => ({ ...prev, [id]: v }));
    },
    []
  );

  return (
    <div className="divide-y">
      {filtered.map((item, i) => {
        const due = formatDueDate(item.dueAt);
        const pConfig = priorityConfig[item.priority];
        const isExpanded = expandedId === item.assignmentId;
        const whatIfScore = whatIfScores[item.assignmentId] ?? 85;
        // Scale grade delta linearly based on what-if score vs original 85% assumption
        const scaledDelta = item.gradeDelta * (whatIfScore / 85);

        return (
          <div key={item.assignmentId}>
            <div
              className="grid grid-cols-[2rem_1fr_140px_80px_130px_80px_70px_90px] gap-3 px-4 py-3 items-center hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => toggleExpand(item.assignmentId)}
            >
              <span className="text-[12px] text-muted-foreground tabular-nums">
                {i + 1}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`text-muted-foreground flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  >
                    <path
                      d="M4.5 3l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item.htmlUrl ? (
                    <a
                      href={item.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[13px] font-medium text-foreground hover:text-primary transition-colors truncate"
                    >
                      {item.assignmentName}
                    </a>
                  ) : (
                    <span className="text-[13px] font-medium truncate">
                      {item.assignmentName}
                    </span>
                  )}
                </div>
                {item.thresholdCrossing && (
                  <span className="text-[11px] font-medium text-emerald-600 ml-5">
                    {item.thresholdCrossing}
                  </span>
                )}
              </div>

              <span className="text-[12px] text-muted-foreground truncate">
                {item.courseName}
              </span>

              <span className="text-[13px] tabular-nums text-right">
                {item.pointsPossible}
              </span>

              <GradeImpactBar delta={item.gradeDelta} maxDelta={maxDelta} />

              <span className="text-[12px] text-muted-foreground">
                {formatEffort(item.estimatedEffort)}
              </span>

              <span
                className={`text-[12px] ${due.urgent ? "text-red-600 font-medium" : "text-muted-foreground"}`}
              >
                {due.text}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${pConfig.bg} ${pConfig.text}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${pConfig.dot}`}
                />
                {pConfig.label}
              </span>
            </div>

            {/* Expanded what-if panel */}
            {isExpanded && (
              <div className="px-4 pb-4 pt-1 ml-8 mr-4">
                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                      If I score
                    </span>
                    <Slider
                      value={[whatIfScore]}
                      onValueChange={(v) =>
                        handleWhatIfChange(item.assignmentId, v)
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1 max-w-[200px]"
                    />
                    <span className="text-[13px] font-semibold tabular-nums w-10 text-right">
                      {whatIfScore}%
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      on this assignment
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-[12px]">
                    <div>
                      <span className="text-muted-foreground">Grade impact: </span>
                      <span className="font-semibold text-emerald-600">
                        +{scaledDelta.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Points: </span>
                      <span className="font-medium">
                        {Math.round(item.pointsPossible * (whatIfScore / 100))}/{item.pointsPossible}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category: </span>
                      <span className="font-medium">
                        {item.categoryName}
                        {item.categoryWeight > 0 && ` (${item.categoryWeight}%)`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. time: </span>
                      <span className="font-medium">
                        {formatEffort(item.estimatedEffort)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

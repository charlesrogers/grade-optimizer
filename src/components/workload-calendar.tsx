"use client";

import { useState } from "react";
import { CalendarAssignment } from "@/lib/types";
import { GradeImpactBar } from "@/components/grade-impact-bar";

const CHILD_COLORS = [
  { bg: "bg-violet-50 dark:bg-violet-950", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-sky-50 dark:bg-sky-950", border: "border-sky-200 dark:border-sky-800", dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-amber-50 dark:bg-amber-950", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-emerald-50 dark:bg-emerald-950", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-rose-50 dark:bg-rose-950", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
];

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getWeekDays(offset: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  // Monday = start of week (day 0 = Sun → go back 6, day 1 = Mon → go back 0, etc.)
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + offset * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function AssignmentCard({
  assignment,
  isParentMode,
}: {
  assignment: CalendarAssignment;
  isParentMode: boolean;
}) {
  const color = assignment.childIndex >= 0
    ? CHILD_COLORS[assignment.childIndex % CHILD_COLORS.length]
    : null;

  return (
    <div
      className={`px-3 py-2.5 rounded-lg border transition-colors ${
        assignment.isHighImpact
          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50"
          : color
            ? `${color.border} ${color.bg}`
            : "bg-card"
      }`}
    >
      {isParentMode && color && (
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
          <span className={`text-[10px] font-semibold ${color.text}`}>
            {assignment.childName}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          {assignment.htmlUrl ? (
            <a
              href={assignment.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-medium text-foreground hover:text-primary truncate block leading-tight"
            >
              {assignment.assignmentName}
            </a>
          ) : (
            <p className="text-[12px] font-medium text-foreground truncate leading-tight">
              {assignment.assignmentName}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {assignment.courseName}
          </p>
        </div>
        {assignment.isHighImpact && (
          <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex-shrink-0">
            HIGH
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <div className="flex-1">
          <GradeImpactBar delta={assignment.gradeImpact} maxDelta={5} />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
          {formatEffort(assignment.estimatedEffort)}
        </span>
      </div>
    </div>
  );
}

function DayColumn({
  date,
  assignments,
  isParentMode,
}: {
  date: Date;
  assignments: CalendarAssignment[];
  isParentMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = isToday(date);
  const dayName = DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dayNum = date.getDate();
  const totalEffort = assignments.reduce((sum, a) => sum + a.estimatedEffort, 0);

  const sorted = [...assignments].sort((a, b) => b.gradeImpact - a.gradeImpact);
  const showAll = expanded || sorted.length <= 4;
  const visible = showAll ? sorted : sorted.slice(0, 4);
  const hiddenCount = sorted.length - visible.length;

  return (
    <div
      className={`flex-1 min-w-0 rounded-xl border p-3 ${
        today ? "bg-primary/[0.03] border-primary/20" : "bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">{dayName}</span>
          <span className="text-[13px] text-muted-foreground">{dayNum}</span>
          {today && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Today
            </span>
          )}
        </div>
        {assignments.length > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatEffort(totalEffort)}
          </span>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-center">
          <p className="text-[11px] text-muted-foreground">Nothing due</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {visible.map((a) => (
            <AssignmentCard
              key={`${a.assignmentId}-${a.childIndex}`}
              assignment={a}
              isParentMode={isParentMode}
            />
          ))}
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-center py-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              +{hiddenCount} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MobileDayColumn({
  date,
  assignments,
  isParentMode,
}: {
  date: Date;
  assignments: CalendarAssignment[];
  isParentMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = isToday(date);
  const dayName = DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dayNum = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const totalEffort = assignments.reduce((sum, a) => sum + a.estimatedEffort, 0);

  if (assignments.length === 0) return null;

  const sorted = [...assignments].sort((a, b) => b.gradeImpact - a.gradeImpact);
  const showAll = expanded || sorted.length <= 4;
  const visible = showAll ? sorted : sorted.slice(0, 4);
  const hiddenCount = sorted.length - visible.length;

  return (
    <div
      className={`rounded-xl border p-3 ${
        today ? "bg-primary/[0.03] border-primary/20" : "bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">
            {dayName}, {month} {dayNum}
          </span>
          {today && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Today
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{assignments.length} item{assignments.length !== 1 ? "s" : ""}</span>
          <span className="text-muted-foreground/40">|</span>
          <span>{formatEffort(totalEffort)}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {visible.map((a) => (
          <AssignmentCard
            key={`${a.assignmentId}-${a.childIndex}`}
            assignment={a}
            isParentMode={isParentMode}
          />
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-center py-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
}

export function WorkloadCalendar({
  assignments,
  isParentMode,
  childNames,
}: {
  assignments: CalendarAssignment[];
  isParentMode: boolean;
  childNames: string[];
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterChild, setFilterChild] = useState<number | null>(null); // null = all

  const weekDays = getWeekDays(weekOffset);

  // Separate "later" items (beyond next week)
  const nextWeekEnd = getWeekDays(1)[6];
  nextWeekEnd.setHours(23, 59, 59, 999);

  const filtered = filterChild !== null
    ? assignments.filter((a) => a.childIndex === filterChild)
    : assignments;

  const laterAssignments = filtered.filter((a) => new Date(a.dueAt) > nextWeekEnd);

  // Group assignments by day for the selected week
  const dayAssignments: Map<number, CalendarAssignment[]> = new Map();
  for (let i = 0; i < 7; i++) {
    dayAssignments.set(i, []);
  }

  for (const a of filtered) {
    const dueDate = new Date(a.dueAt);
    for (let i = 0; i < 7; i++) {
      if (isSameDay(dueDate, weekDays[i])) {
        dayAssignments.get(i)!.push(a);
        break;
      }
    }
  }

  // Check if any mobile days have assignments
  const hasAnyAssignments = Array.from(dayAssignments.values()).some((a) => a.length > 0);

  return (
    <div className="space-y-4">
      {/* Child filter + week nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {isParentMode && childNames.length > 1 && (
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
            <button
              onClick={() => setFilterChild(null)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                filterChild === null
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {childNames.map((name, idx) => {
              const color = CHILD_COLORS[idx % CHILD_COLORS.length];
              return (
                <button
                  key={name}
                  onClick={() => setFilterChild(idx)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                    filterChild === idx
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                  {name}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              weekOffset === 0
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset(1)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              weekOffset === 1
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Next Week
          </button>
        </div>
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden lg:grid lg:grid-cols-7 gap-2">
        {weekDays.map((date, i) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            assignments={dayAssignments.get(i) ?? []}
            isParentMode={isParentMode}
          />
        ))}
      </div>

      {/* Mobile: vertical stack, only days with assignments */}
      <div className="lg:hidden space-y-2">
        {hasAnyAssignments ? (
          weekDays.map((date, i) => (
            <MobileDayColumn
              key={date.toISOString()}
              date={date}
              assignments={dayAssignments.get(i) ?? []}
              isParentMode={isParentMode}
            />
          ))
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center">
            <p className="text-[12px] text-muted-foreground">
              No assignments this week
            </p>
          </div>
        )}
      </div>

      {/* Later section */}
      {laterAssignments.length > 0 && weekOffset === 0 && (
        <LaterSection assignments={laterAssignments} isParentMode={isParentMode} />
      )}
    </div>
  );
}

function LaterSection({
  assignments,
  isParentMode,
}: {
  assignments: CalendarAssignment[];
  isParentMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...assignments].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );

  return (
    <div className="rounded-xl border bg-card p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-foreground">Later</h3>
          <span className="text-[11px] text-muted-foreground">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} beyond next week
          </span>
        </div>
        <span className="text-[12px] text-muted-foreground">
          {expanded ? "Hide" : "Show"}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5">
          {sorted.map((a) => {
            const color = a.childIndex >= 0
              ? CHILD_COLORS[a.childIndex % CHILD_COLORS.length]
              : null;
            const dueDate = new Date(a.dueAt).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            return (
              <div
                key={`${a.assignmentId}-${a.childIndex}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-muted/20"
              >
                {isParentMode && color && (
                  <span className={`w-2 h-2 rounded-full ${color.dot} flex-shrink-0`} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground truncate">
                    {a.assignmentName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {isParentMode && a.childName ? `${a.childName} — ` : ""}
                    {a.courseName}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                  {dueDate}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                  {formatEffort(a.estimatedEffort)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

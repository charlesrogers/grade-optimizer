"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkloadCalendar } from "@/components/workload-calendar";
import { useStudentSelector } from "@/lib/use-student";
import { isDemoMode } from "@/lib/demo-mode";
import {
  Student,
  GradeOptimizerResponse,
  CalendarAssignment,
} from "@/lib/types";

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm shadow-black/[0.04]">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
      {subtext && (
        <p className="text-[12px] text-muted-foreground mt-1">{subtext}</p>
      )}
    </div>
  );
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getBusiestDay(assignments: CalendarAssignment[]): string | null {
  // Only consider this week's assignments
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const thisWeek = assignments.filter((a) => {
    const d = new Date(a.dueAt);
    return d >= monday && d <= sunday;
  });

  if (thisWeek.length === 0) return null;

  const counts: Record<number, number> = {};
  for (const a of thisWeek) {
    const d = new Date(a.dueAt).getDay();
    counts[d] = (counts[d] || 0) + 1;
  }

  let maxDay = 0;
  let maxCount = 0;
  for (const [dayStr, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxDay = Number(dayStr);
    }
  }

  return `${DAY_LABELS[maxDay]} (${maxCount})`;
}

export default function WorkloadPage() {
  const router = useRouter();
  const student = useStudentSelector();
  const [allAssignments, setAllAssignments] = useState<CalendarAssignment[]>([]);
  const [childNames, setChildNames] = useState<string[]>([]);
  const [isParentMode, setIsParentMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkload() {
      setLoading(true);
      setError(null);

      try {
        let observees: Student[] = [];
        try {
          const stored = sessionStorage.getItem("observees");
          if (stored) {
            const parsed = JSON.parse(stored) as Student[];
            if (parsed.length > 0) observees = parsed;
          }
        } catch {
          // no observees
        }

        const demo = isDemoMode();

        if (observees.length > 0) {
          // Parent mode: parallel fetch all children
          const results = await Promise.all(
            observees.map(async (s) => {
              const demoQ = demo ? "&demo=true" : "";
              const res = await fetch(
                `/api/canvas/grades?studentId=${s.id}${demoQ}`
              );
              if (!demo && res.status === 401) {
                router.push("/");
                throw new Error("Not authenticated");
              }
              if (!res.ok) {
                const body = await res.json();
                throw new Error(
                  body.error || `Failed to fetch grades for ${s.name}`
                );
              }
              const data: GradeOptimizerResponse = await res.json();
              return { student: s, data };
            })
          );

          // Merge all assignments
          const merged: CalendarAssignment[] = [];
          const names: string[] = [];
          results.forEach((r, idx) => {
            names.push(r.student.name);
            for (const period of r.data.workload.periods) {
              for (const a of period.assignments) {
                merged.push({
                  ...a,
                  childName: r.student.name,
                  childIndex: idx,
                });
              }
            }
          });

          setAllAssignments(merged);
          setChildNames(names);
          setIsParentMode(true);
        } else {
          // Single student mode
          const res = await fetch(student.buildGradesUrl());
          if (res.status === 401) {
            router.push("/");
            return;
          }
          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error || "Failed to fetch grades");
          }
          const json: GradeOptimizerResponse = await res.json();

          const merged: CalendarAssignment[] = [];
          for (const period of json.workload.periods) {
            for (const a of period.assignments) {
              merged.push({ ...a, childName: "", childIndex: -1 });
            }
          }

          setAllAssignments(merged);
          setChildNames([]);
          setIsParentMode(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkload();
  }, [router, student.buildGradesUrl]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="h-7 w-48 bg-muted animate-pulse rounded-md" />
          <div className="grid gap-4 grid-cols-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="hidden lg:grid lg:grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <p className="text-[15px] font-medium mb-1">Something went wrong</p>
          <p className="text-[13px] text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  // Compute stats from this week's assignments
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const thisWeekAssignments = allAssignments.filter((a) => {
    const d = new Date(a.dueAt);
    return d >= monday && d <= sunday;
  });

  const thisWeekCount = thisWeekAssignments.length;
  const thisWeekEffort = thisWeekAssignments.reduce(
    (sum, a) => sum + a.estimatedEffort,
    0
  );
  const highImpactCount = allAssignments.filter((a) => a.isHighImpact).length;
  const busiestDay = getBusiestDay(allAssignments);

  // Headline
  const headline = isParentMode
    ? thisWeekCount === 0
      ? "Clear week for everyone"
      : `${childNames.join(" and ")} ${childNames.length > 1 ? "have" : "has"} ${thisWeekCount} assignment${thisWeekCount !== 1 ? "s" : ""} this week`
    : thisWeekCount === 0
      ? "Clear week ahead"
      : `${thisWeekCount} assignment${thisWeekCount !== 1 ? "s" : ""} due this week`;

  const highImpactThisWeek = thisWeekAssignments.filter((a) => a.isHighImpact);
  const topAssignment = thisWeekAssignments.sort(
    (a, b) => b.gradeImpact - a.gradeImpact
  )[0];

  const weekDescription =
    thisWeekCount === 0
      ? "Nothing due this week — use the time to get ahead"
      : thisWeekCount === 1
        ? `Just 1 assignment this week — ${topAssignment ? `"${topAssignment.assignmentName}" in ${topAssignment.courseName}` : "stay on top of it"}`
        : highImpactThisWeek.length > 0
          ? `${thisWeekCount} assignments due, ${highImpactThisWeek.length} with outsized grade impact — prioritize those`
          : `${thisWeekCount} assignments due — ${formatEffort(thisWeekEffort)} of work total`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{headline}</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
          {weekDescription}
        </p>
      </div>

      <div className={`grid gap-4 ${isParentMode ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        <StatCard
          label="This Week"
          value={formatEffort(thisWeekEffort)}
          subtext={
            thisWeekCount > 0
              ? `${thisWeekCount} assignments — plan your time`
              : "Free and clear"
          }
        />
        <StatCard
          label="High Impact"
          value={String(highImpactCount)}
          subtext={
            highImpactCount > 0
              ? "These carry extra weight — few grades in the category means each one matters more"
              : "No outsized risks this cycle"
          }
        />
        <StatCard
          label="Total Upcoming"
          value={String(allAssignments.length)}
          subtext={
            allAssignments.length > 0
              ? `${formatEffort(allAssignments.reduce((s, a) => s + a.estimatedEffort, 0))} of work across all periods`
              : "Nothing on the horizon"
          }
        />
        {isParentMode && (
          <StatCard
            label="Busiest Day"
            value={busiestDay ?? "—"}
            subtext={
              busiestDay
                ? "Most assignments due — plan to be available"
                : "Even spread this week"
            }
          />
        )}
      </div>

      <WorkloadCalendar
        assignments={allAssignments}
        isParentMode={isParentMode}
        childNames={childNames}
      />
    </div>
  );
}

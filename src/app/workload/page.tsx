"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkloadRadarView } from "@/components/workload-radar";
import { ChildSelector } from "@/components/child-selector";
import { useStudentSelector } from "@/lib/use-student";
import { GradeOptimizerResponse } from "@/lib/types";

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

export default function WorkloadPage() {
  const router = useRouter();
  const [data, setData] = useState<GradeOptimizerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const student = useStudentSelector();

  useEffect(() => {
    async function fetchGrades() {
      setLoading(true);
      try {
        const res = await fetch(student.buildGradesUrl());
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to fetch grades");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, [router, student.buildGradesUrl]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="h-7 w-48 bg-muted animate-pulse rounded-md" />
          <div className="grid gap-4 grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
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

  if (!data) return null;

  const { workload } = data;
  const thisWeek = workload.periods.find((p) => p.label === "This Week");

  // Build smart descriptions
  const thisWeekCount = thisWeek?.assignments.length ?? 0;
  const highImpact = thisWeek?.assignments.filter((a) => a.isHighImpact) ?? [];
  const topAssignment = thisWeek?.assignments[0];

  const weekDescription =
    thisWeekCount === 0
      ? "Nothing due this week — use the time to get ahead"
      : thisWeekCount === 1
        ? `Just 1 assignment this week — ${topAssignment ? `"${topAssignment.assignmentName}" in ${topAssignment.courseName}` : "stay on top of it"}`
        : highImpact.length > 0
          ? `${thisWeekCount} assignments due, ${highImpact.length} with outsized grade impact — prioritize those`
          : `${thisWeekCount} assignments due — ${formatEffort(thisWeek?.totalEffort ?? 0)} of work total`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {thisWeekCount === 0
            ? "Clear week ahead"
            : `${thisWeekCount} assignment${thisWeekCount > 1 ? "s" : ""} due this week`}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
          {weekDescription}
        </p>
      </div>

      {student.isParent && (
        <ChildSelector
          observees={student.observees}
          selectedId={student.selectedId}
          onSelect={student.setSelectedId}
        />
      )}

      <div className="grid gap-4 grid-cols-3">
        <StatCard
          label="This Week"
          value={thisWeek ? formatEffort(thisWeek.totalEffort) : "0h"}
          subtext={thisWeekCount > 0 ? `${thisWeekCount} assignments — plan your time` : "Free and clear"}
        />
        <StatCard
          label="High Impact"
          value={String(workload.highImpactCount)}
          subtext={workload.highImpactCount > 0
            ? "These carry extra weight — few grades in the category means each one matters more"
            : "No outsized risks this cycle"}
        />
        <StatCard
          label="Total Upcoming"
          value={String(workload.totalUpcoming)}
          subtext={workload.totalUpcoming > 0
            ? `${formatEffort(workload.totalEffort)} of work across all periods`
            : "Nothing on the horizon"}
        />
      </div>

      <WorkloadRadarView workload={workload} />
    </div>
  );
}

"use client";

import { WorkloadRadar as WorkloadRadarType, WorkloadAssignment } from "@/lib/types";
import { GradeImpactBar } from "@/components/grade-impact-bar";

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function AssignmentRow({ assignment }: { assignment: WorkloadAssignment }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border transition-colors ${
        assignment.isHighImpact
          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50"
          : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {assignment.htmlUrl ? (
            <a
              href={assignment.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-foreground hover:text-primary truncate block"
            >
              {assignment.assignmentName}
            </a>
          ) : (
            <p className="text-[13px] font-medium text-foreground truncate">
              {assignment.assignmentName}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {assignment.courseName}
            <span className="text-muted-foreground/50"> / {assignment.categoryName}</span>
          </p>
        </div>
        {assignment.isHighImpact && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex-shrink-0">
            HIGH
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-2">
        <div className="flex-1">
          <GradeImpactBar delta={assignment.gradeImpact} maxDelta={5} />
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
          {formatEffort(assignment.estimatedEffort)}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
          {formatDate(assignment.dueAt)}
        </span>
      </div>
    </div>
  );
}

function PeriodColumn({
  label,
  assignments,
  totalEffort,
  totalGradeImpact,
}: {
  label: string;
  assignments: WorkloadAssignment[];
  totalEffort: number;
  totalGradeImpact: number;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-foreground">{label}</h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {assignments.length > 0 && (
            <>
              <span>{assignments.length} items</span>
              <span className="text-muted-foreground/40">|</span>
              <span>{formatEffort(totalEffort)}</span>
            </>
          )}
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center">
          <p className="text-[12px] text-muted-foreground">
            {label === "This Week" ? "Nothing due — good time to get ahead on next week" : "All clear"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <AssignmentRow key={a.assignmentId} assignment={a} />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkloadRadarView({
  workload,
}: {
  workload: WorkloadRadarType;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {workload.periods.map((period) => (
        <PeriodColumn
          key={period.label}
          label={period.label}
          assignments={period.assignments}
          totalEffort={period.totalEffort}
          totalGradeImpact={period.totalGradeImpact}
        />
      ))}
    </div>
  );
}

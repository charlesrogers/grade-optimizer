"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { ForecastTargets } from "@/components/forecast-targets";
import { ChildSelector } from "@/components/child-selector";
import { useStudentSelector } from "@/lib/use-student";
import { GradeOptimizerResponse, TodoItem, CourseForecast, PredictiveAlert, GradeDelta, GradeSnapshot, AssignmentChange } from "@/lib/types";
import { generateAlerts } from "@/lib/alerts";
import { saveSnapshot, computeDelta, getSnapshotHistory } from "@/lib/snapshots";
import { Sparkline } from "@/components/sparkline";
import { TrendChart } from "@/components/trend-chart";

// === Helpers ===

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function gradeToGPA(grade: number): number {
  if (grade >= 93) return 4.0;
  if (grade >= 90) return 3.7;
  if (grade >= 87) return 3.3;
  if (grade >= 83) return 3.0;
  if (grade >= 80) return 2.7;
  if (grade >= 77) return 2.3;
  if (grade >= 73) return 2.0;
  if (grade >= 70) return 1.7;
  if (grade >= 67) return 1.3;
  if (grade >= 63) return 1.0;
  if (grade >= 60) return 0.7;
  return 0.0;
}

function buildHeadline(data: GradeOptimizerResponse): {
  title: string;
  subtitle: string;
  accent: "green" | "red" | "default";
} {
  const critical = data.todos.filter((t) => t.priority === "critical");
  const gpaDiff = data.maxPotentialGPA - data.overallGPA;

  // Most urgent: critical items costing you points
  if (critical.length > 0) {
    const totalDelta = critical.reduce((s, t) => s + t.gradeDelta, 0);
    return {
      title: `${critical.length} overdue assignment${critical.length > 1 ? "s are" : " is"} dragging your grades down`,
      subtitle: `Finishing ${critical.length === 1 ? "it" : "them"} recovers up to +${totalDelta.toFixed(1)}% across your courses. Start with "${critical[0].assignmentName}" in ${critical[0].courseName}.`,
      accent: "red",
    };
  }

  // Second: missing work with recoverable GPA
  if (data.totalMissing > 0 && gpaDiff > 0.1) {
    return {
      title: `${data.totalMissing} missing assignment${data.totalMissing > 1 ? "s" : ""} — your GPA could be ${data.maxPotentialGPA.toFixed(2)}`,
      subtitle: `You're leaving ${gpaDiff.toFixed(2)} GPA points on the table. The biggest opportunity is "${data.todos[0]?.assignmentName}" (+${data.todos[0]?.gradeDelta}%).`,
      accent: "red",
    };
  }

  // Third: upcoming work to stay ahead
  if (data.todos.length > 0) {
    const top = data.todos[0];
    return {
      title: `You're in good shape — stay ahead by tackling what's next`,
      subtitle: `"${top.assignmentName}" in ${top.courseName} has the biggest grade impact right now (+${top.gradeDelta}%).`,
      accent: "green",
    };
  }

  return {
    title: `All caught up — nothing needs attention right now`,
    subtitle: `Your current GPA is ${data.overallGPA.toFixed(2)} across ${data.courses.length} courses. Keep it going.`,
    accent: "green",
  };
}

function buildQuickWins(todos: TodoItem[]): TodoItem[] {
  // Top 3 highest-efficiency items that fit in ~1 hour
  const wins: TodoItem[] = [];
  let totalTime = 0;
  for (const t of todos) {
    if (wins.length >= 3) break;
    if (totalTime + t.estimatedEffort <= 90) {
      wins.push(t);
      totalTime += t.estimatedEffort;
    }
  }
  return wins;
}

function buildRiskInsight(forecasts: CourseForecast[]): string | null {
  // Find courses trending toward a letter grade drop
  const atRisk = forecasts.filter((f) => {
    const current = f.targets.find(
      (t) => t.feasible && t.minGrade <= f.projectedFinalGrade
    );
    if (!current) return false;
    // Projected grade is within 3% of dropping to the next letter
    return f.projectedFinalGrade - current.minGrade < 3;
  });

  if (atRisk.length > 0) {
    const worst = atRisk.sort(
      (a, b) => a.projectedFinalGrade - b.projectedFinalGrade
    )[0];
    const currentTarget = worst.targets.find(
      (t) => t.feasible && t.minGrade <= worst.projectedFinalGrade
    );
    if (currentTarget) {
      const margin = worst.projectedFinalGrade - currentTarget.minGrade;
      return `${worst.courseName} is only ${margin.toFixed(1)}% above a ${currentTarget.letter} — one bad assignment could drop it.`;
    }
  }
  return null;
}

// === Components ===

const priorityColors: Record<string, string> = {
  critical: "bg-red-50 text-red-700 ring-red-600/10",
  high: "bg-amber-50 text-amber-700 ring-amber-600/10",
  medium: "bg-blue-50 text-blue-700 ring-blue-600/10",
  low: "bg-slate-50 text-slate-600 ring-slate-600/10",
};

function QuickWinsCard({ todos, data }: { todos: TodoItem[]; data: GradeOptimizerResponse }) {
  if (todos.length === 0) return null;

  const totalEffort = todos.reduce((s, t) => s + t.estimatedEffort, 0);
  const totalDelta = todos.reduce((s, t) => s + t.gradeDelta, 0);

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground">
            Quick wins — do these first
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {formatEffort(totalEffort)} of work for +{totalDelta.toFixed(1)}% grade boost
          </p>
        </div>
        <Link
          href="/tonight"
          className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Full study plan
        </Link>
      </div>
      <div className="px-3 pb-3">
        {todos.map((todo, idx) => (
          <div
            key={todo.assignmentId}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex-shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">
                {todo.assignmentName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {todo.courseName} · {formatEffort(todo.estimatedEffort)} · +{todo.gradeDelta.toFixed(1)}%
              </p>
            </div>
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset flex-shrink-0 ${priorityColors[todo.priority]}`}>
              {todo.priority}
            </span>
            {todo.thresholdCrossing && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 flex-shrink-0">
                {todo.thresholdCrossing}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ThisWeekPreview({ data }: { data: GradeOptimizerResponse }) {
  const thisWeek = data.workload.periods.find((p) => p.label === "This Week");
  if (!thisWeek || thisWeek.assignments.length === 0) return null;

  const topAssignments = thisWeek.assignments.slice(0, 3);

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-start justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground">
            Due this week
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {thisWeek.assignments.length} assignment{thisWeek.assignments.length > 1 ? "s" : ""} · {formatEffort(thisWeek.totalEffort)} of work
          </p>
        </div>
        <Link
          href="/workload"
          className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
        >
          See all upcoming
        </Link>
      </div>
      <div className="px-3 pb-3">
        {topAssignments.map((a) => (
          <div
            key={a.assignmentId}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">
                {a.assignmentName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {a.courseName} · +{a.gradeImpact.toFixed(1)}% grade impact
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
              {formatEffort(a.estimatedEffort)}
            </span>
            {a.isHighImpact && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 flex-shrink-0">
                HIGH
              </span>
            )}
          </div>
        ))}
        {thisWeek.assignments.length > 3 && (
          <Link
            href="/workload"
            className="block text-center text-[12px] text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            +{thisWeek.assignments.length - 3} more this week
          </Link>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  insight,
  accent,
  sparklineData,
  sparklineColor,
}: {
  label: string;
  value: string;
  insight: string;
  accent?: "green" | "red" | "default";
  sparklineData?: number[];
  sparklineColor?: string;
}) {
  const valueColor =
    accent === "green"
      ? "text-emerald-600"
      : accent === "red"
        ? "text-red-600"
        : "text-foreground";

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm shadow-black/[0.04]">
      <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <p className={`text-2xl font-semibold tracking-tight ${valueColor}`}>
          {value}
        </p>
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline data={sparklineData} width={56} height={18} color={sparklineColor ?? "#6366f1"} />
        )}
      </div>
      <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
        {insight}
      </p>
    </div>
  );
}

// === Alert + Delta Components ===

const alertSeverityColors: Record<string, string> = {
  critical: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-blue-200 bg-blue-50",
};
const alertSeverityText: Record<string, string> = {
  critical: "text-red-900",
  warning: "text-amber-900",
  info: "text-blue-900",
};
const alertSeverityDot: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

function AlertFeed({ alerts }: { alerts: PredictiveAlert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.slice(0, 4).map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${alertSeverityColors[alert.severity]}`}
        >
          <span className="h-5 w-5 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className={`h-2 w-2 rounded-full ${alertSeverityDot[alert.severity]}`} />
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-[13px] font-medium ${alertSeverityText[alert.severity]}`}>
              {alert.title}
            </p>
            <p className={`text-[12px] mt-0.5 ${alert.severity === "critical" ? "text-red-800" : alert.severity === "warning" ? "text-amber-800" : "text-blue-800"}`}>
              {alert.detail}
            </p>
            <p className="text-[11px] mt-1 text-muted-foreground italic">
              {alert.actionable}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeltaBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
      positive ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
    }`}>
      {positive ? "+" : ""}{value}{suffix}
    </span>
  );
}

function AssignmentDrillDown({ changes }: { changes: AssignmentChange[] }) {
  const graded = changes.filter((c) => c.changeType === "graded");
  const scoreChanged = changes.filter((c) => c.changeType === "score_changed");
  const newlyMissing = changes.filter((c) => c.changeType === "newly_missing");
  const noLongerMissing = changes.filter((c) => c.changeType === "no_longer_missing");

  return (
    <div className="space-y-2 px-3 pt-1 pb-1">
      {graded.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider mb-1">Newly graded</p>
          {graded.map((a) => (
            <div key={a.assignmentId} className="flex items-center gap-2 text-[11px] py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-foreground truncate">{a.assignmentName}</span>
              <span className="text-muted-foreground truncate">{a.courseName}</span>
              <span className="tabular-nums font-medium text-emerald-600 ml-auto flex-shrink-0">{a.newScore?.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
      {scoreChanged.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-blue-700 uppercase tracking-wider mb-1">Scores changed</p>
          {scoreChanged.map((a) => (
            <div key={a.assignmentId} className="flex items-center gap-2 text-[11px] py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-foreground truncate">{a.assignmentName}</span>
              <span className="text-muted-foreground truncate">{a.courseName}</span>
              <span className="tabular-nums ml-auto flex-shrink-0">
                {a.oldScore?.toFixed(0)}%
                <span className="text-muted-foreground mx-1">&rarr;</span>
                <span className={`font-medium ${(a.newScore ?? 0) >= (a.oldScore ?? 0) ? "text-emerald-600" : "text-red-600"}`}>
                  {a.newScore?.toFixed(0)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
      {newlyMissing.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-red-700 uppercase tracking-wider mb-1">Newly missing</p>
          {newlyMissing.map((a) => (
            <div key={a.assignmentId} className="flex items-center gap-2 text-[11px] py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
              <span className="text-foreground truncate">{a.assignmentName}</span>
              <span className="text-muted-foreground truncate">{a.courseName}</span>
            </div>
          ))}
        </div>
      )}
      {noLongerMissing.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider mb-1">No longer missing</p>
          {noLongerMissing.map((a) => (
            <div key={a.assignmentId} className="flex items-center gap-2 text-[11px] py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-foreground truncate">{a.assignmentName}</span>
              <span className="text-muted-foreground truncate">{a.courseName}</span>
              {a.newScore !== null && (
                <span className="tabular-nums font-medium text-emerald-600 ml-auto flex-shrink-0">{a.newScore.toFixed(0)}%</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaBar({ delta }: { delta: GradeDelta }) {
  const [showDetails, setShowDetails] = useState(false);
  const hasAssignmentChanges = (delta.assignmentChanges?.length ?? 0) > 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">What changed</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">Since {delta.snapshotAge}</p>
      </div>
      <div className="px-3 pb-3">
        <div className="flex flex-wrap gap-3 px-3 py-2">
          {delta.gpaChange !== null && (
            <span className="text-[12px] text-muted-foreground">
              GPA {delta.gpaChange > 0 ? "+" : ""}{delta.gpaChange.toFixed(2)} <DeltaBadge value={delta.gpaChange} />
            </span>
          )}
          {delta.missingChange !== null && (
            <span className="text-[12px] text-muted-foreground">
              Missing {delta.missingChange > 0 ? "+" : ""}{delta.missingChange} <DeltaBadge value={-delta.missingChange} />
            </span>
          )}
        </div>
        {delta.courseChanges.length > 0 && (
          <div className="space-y-0.5 px-3">
            {delta.courseChanges.map((cc) => (
              <div key={cc.courseId} className="flex items-center gap-2 text-[12px]">
                <span className="text-muted-foreground truncate">{cc.courseName}</span>
                <span className="tabular-nums">
                  {cc.oldGrade.toFixed(0)}%<span className="text-muted-foreground mx-1">&rarr;</span>{cc.newGrade.toFixed(0)}%
                </span>
                <DeltaBadge value={cc.gradeChange} suffix="%" />
                {cc.oldLetter !== cc.newLetter && (
                  <span className={`text-[10px] font-semibold ${cc.newGrade > cc.oldGrade ? "text-emerald-600" : "text-red-600"}`}>
                    {cc.oldLetter} &rarr; {cc.newLetter}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {hasAssignmentChanges && (
          <div className="px-3 pt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              {showDetails ? "Hide" : "Show"} assignment details
              <svg className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showDetails && <AssignmentDrillDown changes={delta.assignmentChanges!} />}
          </div>
        )}
      </div>
    </div>
  );
}

function formatUpdatedAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function SkeletonDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-96 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-full max-w-lg bg-muted animate-pulse rounded-md" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// === Main Page ===

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<GradeOptimizerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [delta, setDelta] = useState<GradeDelta | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [snapshotHistory, setSnapshotHistory] = useState<GradeSnapshot[]>([]);
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
        const json: GradeOptimizerResponse = await res.json();
        setData(json);
        setFetchedAt(new Date());

        // Generate alerts
        setAlerts(generateAlerts(json));

        // Compute delta from last snapshot, then save new snapshot
        const studentId = json.selectedStudent?.id ?? "default";
        const studentName = json.selectedStudent?.name ?? "You";
        const d = computeDelta(studentId, studentName, json);
        setDelta(d);
        saveSnapshot(studentId, json);
        setSnapshotHistory(getSnapshotHistory(studentId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, [router, student.buildGradesUrl]);

  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <span className="text-destructive text-lg">!</span>
          </div>
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

  const headline = buildHeadline(data);
  const quickWins = buildQuickWins(data.todos);
  const riskInsight = buildRiskInsight(data.forecasts);
  const gpaDiff = data.maxPotentialGPA - data.overallGPA;

  const forecastGPA =
    data.forecasts.length > 0
      ? Math.round(
          (data.forecasts.reduce(
            (sum, f) => sum + gradeToGPA(f.projectedFinalGrade),
            0
          ) / data.forecasts.length) * 100
        ) / 100
      : data.overallGPA;

  // Build smart stat card insights
  const missingInsight =
    data.totalMissing === 0
      ? "Nothing overdue — keep it that way"
      : data.totalMissing === 1
        ? `1 zero in the gradebook is pulling your average down`
        : `${data.totalMissing} zeros in the gradebook are pulling your averages down`;

  const forecastInsight =
    forecastGPA > data.overallGPA + 0.05
      ? `Based on your category averages, your grades are trending up`
      : forecastGPA < data.overallGPA - 0.05
        ? `Your category averages suggest grades may slip — check the forecast below`
        : `Your performance is consistent — grades should hold steady`;

  const actionInsight =
    data.todos.length === 0
      ? "Nothing to optimize right now"
      : data.todos.filter((t) => t.priority === "critical").length > 0
        ? `${data.todos.filter((t) => t.priority === "critical").length} need immediate attention — every day they're late costs you more`
        : data.todos.filter((t) => t.priority === "high").length > 0
          ? `${data.todos.filter((t) => t.priority === "high").length} are due soon or have big grade impact`
          : `All low priority — you're ahead of the curve`;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Dynamic headline + trust signal */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{headline.title}</h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {headline.subtitle}
            </p>
          </div>
          {fetchedAt && (
            <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
              Data from Canvas · Updated {formatUpdatedAgo(fetchedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Preview parent view link for non-parent accounts */}
      {!student.isParent && (
        <Link
          href="/family/demo"
          className="text-[12px] font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          Preview parent view &rarr;
        </Link>
      )}

      {/* Child selector for parent accounts */}
      {student.isParent && (
        <ChildSelector
          observees={student.observees}
          selectedId={student.selectedId}
          onSelect={student.setSelectedId}
        />
      )}

      {/* What Changed — diff from last visit */}
      {delta && <DeltaBar delta={delta} />}

      {/* Predictive Alerts — replaces the old single risk banner */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-[14px] font-semibold mb-2">Alerts</h2>
          <AlertFeed alerts={alerts} />
        </div>
      )}

      {/* Legacy risk banner (only if no alerts cover it) */}
      {alerts.length === 0 && riskInsight && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <div>
            <p className="text-[13px] font-medium text-amber-900">Grade at risk</p>
            <p className="text-[12px] text-amber-800 mt-0.5">{riskInsight}</p>
          </div>
        </div>
      )}

      {/* Stat Cards — with "so what?" insights */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current GPA"
          value={data.overallGPA.toFixed(2)}
          insight={`Across ${data.courses.length} courses${gpaDiff > 0.1 ? ` — could be ${data.maxPotentialGPA.toFixed(2)} with missing work done` : ""}`}
          sparklineData={snapshotHistory.map((s) => s.overallGPA)}
          sparklineColor="#6366f1"
        />
        <StatCard
          label="Forecast"
          value={forecastGPA.toFixed(2)}
          insight={forecastInsight}
          accent={forecastGPA >= data.overallGPA ? "green" : "red"}
        />
        <StatCard
          label="Missing"
          value={String(data.totalMissing)}
          insight={missingInsight}
          accent={data.totalMissing > 0 ? "red" : "default"}
        />
        <StatCard
          label="Action Items"
          value={String(data.todos.length)}
          insight={actionInsight}
        />
      </div>

      {/* Quick wins + this week — side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <QuickWinsCard todos={quickWins} data={data} />
        <ThisWeekPreview data={data} />
      </div>

      {/* Grade Trends — historical chart */}
      {snapshotHistory.length >= 2 && (
        <TrendChart snapshots={snapshotHistory} />
      )}

      {/* Course Cards */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[15px] font-semibold">Your courses</h2>
          <p className="text-[12px] text-muted-foreground">
            Sorted by what needs the most attention
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.courses
            .sort(
              (a, b) =>
                b.missingCount - a.missingCount ||
                a.currentGrade - b.currentGrade
            )
            .map((course) => (
              <CourseCard
                key={course.courseId}
                breakdown={course}
                forecast={data.forecasts.find(
                  (f) => f.courseId === course.courseId
                )}
                gradeHistory={snapshotHistory.length >= 2
                  ? snapshotHistory.map((s) => s.courses.find((c) => c.courseId === course.courseId)?.currentGrade).filter((g): g is number => g !== undefined)
                  : undefined
                }
              />
            ))}
        </div>
      </div>

      {/* Grade Forecast — expandable per-course details */}
      {data.forecasts.length > 0 && (
        <ForecastTargets forecasts={data.forecasts} />
      )}
    </div>
  );
}

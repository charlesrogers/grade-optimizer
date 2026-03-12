"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Student,
  GradeOptimizerResponse,
  TodoItem,
  ChildHealthScore,
  PredictiveAlert,
  ConversationScript,
  GradeDelta,
  GradeSnapshot,
  AssignmentChange,
} from "@/lib/types";
import { calculateHealthScore } from "@/lib/health-score";
import { generateAlerts } from "@/lib/alerts";
import { generateConversationScripts } from "@/lib/conversation-scripts";
import { saveSnapshot, computeDelta, getSnapshotHistory } from "@/lib/snapshots";
import { Sparkline } from "@/components/sparkline";

// === Helpers ===

interface ChildData {
  student: Student;
  data: GradeOptimizerResponse;
}

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function gradeColor(grade: number): string {
  if (grade >= 90) return "text-emerald-600";
  if (grade >= 80) return "text-blue-600";
  if (grade >= 70) return "text-amber-600";
  if (grade >= 60) return "text-orange-600";
  return "text-red-600";
}

function healthLevelColors(level: "green" | "yellow" | "red") {
  if (level === "green")
    return {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      ring: "ring-emerald-600/10",
      text: "text-emerald-700 dark:text-emerald-400",
      fill: "bg-emerald-500",
      label: "On track",
    };
  if (level === "yellow")
    return {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      ring: "ring-amber-600/10",
      text: "text-amber-700 dark:text-amber-400",
      fill: "bg-amber-500",
      label: "Needs attention",
    };
  return {
    bg: "bg-red-50 dark:bg-red-500/10",
    ring: "ring-red-600/10",
    text: "text-red-700 dark:text-red-400",
    fill: "bg-red-500",
    label: "At risk",
  };
}

function findRiskyCourses(child: ChildData): string[] {
  return child.data.forecasts
    .filter((f) => {
      const currentThreshold = [...f.targets]
        .filter((t) => t.minGrade <= f.projectedFinalGrade)
        .sort((a, b) => b.minGrade - a.minGrade)[0];
      if (!currentThreshold) return false;
      return f.projectedFinalGrade - currentThreshold.minGrade < 3;
    })
    .map((f) => f.courseName);
}

function findWeakCategories(
  child: ChildData
): { course: string; category: string; avg: number }[] {
  const weak: { course: string; category: string; avg: number }[] = [];
  for (const forecast of child.data.forecasts) {
    for (const trend of forecast.categoryTrends) {
      if (
        trend.gradedCount >= 2 &&
        trend.averageScore < 75 &&
        trend.weight >= 10
      ) {
        weak.push({
          course: forecast.courseName,
          category: trend.groupName,
          avg: trend.averageScore,
        });
      }
    }
  }
  return weak.sort((a, b) => a.avg - b.avg);
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/10",
  high: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/10",
  medium: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/10",
  low: "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-600/10",
};

const alertSeverityColors: Record<string, string> = {
  critical: "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10",
  warning: "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10",
  info: "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10",
};

const alertSeverityText: Record<string, string> = {
  critical: "text-red-900 dark:text-red-200",
  warning: "text-amber-900 dark:text-amber-200",
  info: "text-blue-900 dark:text-blue-200",
};

const alertSeverityDetail: Record<string, string> = {
  critical: "text-red-800 dark:text-red-300",
  warning: "text-amber-800 dark:text-amber-300",
  info: "text-blue-800 dark:text-blue-300",
};

const alertSeverityDot: Record<string, string> = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

// === Delta Badge ===

function DeltaBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tabular-nums ${
        positive
          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20"
          : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/20"
      }`}
    >
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

// === Conversation Script Card ===

function ConversationCard({ script }: { script: ConversationScript }) {
  if (script.items.length === 0) return null;

  return (
    <div className="px-5 pt-2 pb-3">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Tonight, ask {script.childName} about
      </p>
      <div className="space-y-2">
        {script.items.map((item, i) => (
          <div
            key={i}
            className="px-3 py-2.5 rounded-lg bg-primary/[0.03] border border-primary/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset flex-shrink-0 ${priorityColors[item.priority]}`}
              >
                {item.priority}
              </span>
              <p className="text-[13px] font-medium text-foreground truncate">
                {item.assignmentName}
              </p>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              {item.courseName} · {item.status}
            </p>
            <p className="text-[12px] text-foreground/80 mt-1">
              {item.whyItMatters} · {item.suggestedApproach}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Alert Feed ===

function AlertFeed({ alerts }: { alerts: PredictiveAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map((alert) => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${alertSeverityColors[alert.severity]}`}
        >
          <span className="h-5 w-5 rounded-full bg-white/60 dark:bg-neutral-900/60 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span
              className={`h-2 w-2 rounded-full ${alertSeverityDot[alert.severity]}`}
            />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className={`text-[13px] font-medium ${alertSeverityText[alert.severity]}`}
            >
              {alert.title}
            </p>
            <p
              className={`text-[12px] mt-0.5 ${alertSeverityDetail[alert.severity]}`}
            >
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

// === Assignment Drill-Down ===

function FamilyAssignmentDrillDown({ changes }: { changes: AssignmentChange[] }) {
  const graded = changes.filter((c) => c.changeType === "graded");
  const scoreChanged = changes.filter((c) => c.changeType === "score_changed");
  const newlyMissing = changes.filter((c) => c.changeType === "newly_missing");
  const noLongerMissing = changes.filter((c) => c.changeType === "no_longer_missing");

  return (
    <div className="space-y-2 pt-1">
      {graded.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Newly graded</p>
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
          <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">Scores changed</p>
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
          <p className="text-[10px] font-medium text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Newly missing</p>
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
          <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">No longer missing</p>
          {noLongerMissing.map((a) => (
            <div key={a.assignmentId} className="flex items-center gap-2 text-[11px] py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-foreground truncate">{a.assignmentName}</span>
              <span className="text-muted-foreground truncate">{a.courseName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === What Changed (Delta) View ===

function DeltaViewItem({ delta }: { delta: GradeDelta }) {
  const [showDetails, setShowDetails] = useState(false);
  const hasAssignmentChanges = (delta.assignmentChanges?.length ?? 0) > 0;

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-[13px] font-medium text-foreground">
          {delta.studentName}
        </p>
        <span className="text-[10px] text-muted-foreground">
          vs {delta.snapshotAge}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {delta.gpaChange !== null && (
          <span className="text-[12px] text-muted-foreground">
            GPA {delta.gpaChange > 0 ? "+" : ""}
            {delta.gpaChange.toFixed(2)}{" "}
            <DeltaBadge value={delta.gpaChange} />
          </span>
        )}
        {delta.missingChange !== null && (
          <span className="text-[12px] text-muted-foreground">
            Missing{" "}
            {delta.missingChange > 0
              ? `+${delta.missingChange}`
              : delta.missingChange}{" "}
            <DeltaBadge value={-delta.missingChange} />
          </span>
        )}
      </div>
      {delta.courseChanges.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {delta.courseChanges.map((cc) => (
            <div
              key={cc.courseId}
              className="flex items-center gap-2 text-[12px]"
            >
              <span className="text-muted-foreground truncate">
                {cc.courseName}
              </span>
              <span className="tabular-nums">
                {cc.oldGrade.toFixed(0)}%
                <span className="text-muted-foreground mx-1">
                  &rarr;
                </span>
                {cc.newGrade.toFixed(0)}%
              </span>
              <DeltaBadge value={cc.gradeChange} suffix="%" />
              {cc.oldLetter !== cc.newLetter && (
                <span
                  className={`text-[10px] font-semibold ${
                    cc.newGrade > cc.oldGrade
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {cc.oldLetter} &rarr; {cc.newLetter}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {hasAssignmentChanges && (
        <div className="mt-1.5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            {showDetails ? "Hide" : "Show"} assignment details
            <svg className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""}`} viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showDetails && <FamilyAssignmentDrillDown changes={delta.assignmentChanges!} />}
        </div>
      )}
    </div>
  );
}

function DeltaView({ deltas }: { deltas: GradeDelta[] }) {
  const meaningful = deltas.filter((d) => d !== null);
  if (meaningful.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">
          What changed
        </h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Since your last visit
        </p>
      </div>
      <div className="px-3 pb-3 space-y-1">
        {meaningful.map((delta) => (
          <DeltaViewItem key={delta.studentId} delta={delta} />
        ))}
      </div>
    </div>
  );
}

// === Health Score Badge ===

function HealthBadge({ health }: { health: ChildHealthScore }) {
  const colors = healthLevelColors(health.level);
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8">
        <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/20"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            strokeWidth="3"
            strokeDasharray={`${health.score} ${100 - health.score}`}
            strokeLinecap="round"
            className={colors.text}
            stroke="currentColor"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
          {health.score}
        </span>
      </div>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset ${colors.bg} ${colors.ring} ${colors.text}`}
      >
        {colors.label}
      </span>
    </div>
  );
}

// === Child Card ===

function ChildCard({
  child,
  health,
  script,
  alerts,
  defaultExpanded,
  gpaHistory,
}: {
  child: ChildData;
  health: ChildHealthScore;
  script: ConversationScript;
  alerts: PredictiveAlert[];
  defaultExpanded: boolean;
  gpaHistory?: number[];
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const riskyCourses = findRiskyCourses(child);
  const weakCategories = findWeakCategories(child);
  const { data } = child;

  const criticalTodos = data.todos.filter((t) => t.priority === "critical");
  const highTodos = data.todos.filter((t) => t.priority === "high");
  const topTodos = [...criticalTodos, ...highTodos].slice(0, 5);

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
      >
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center flex-shrink-0">
          <span className="text-[14px] font-bold text-white">
            {child.student.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Name + health score */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold text-foreground">
              {child.student.name}
            </p>
            <HealthBadge health={health} />
          </div>
          {health.level !== "green" && (
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">
              {buildQuickInsight(child, health)}
            </p>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <p
                className={`text-[18px] font-semibold tabular-nums ${gradeColor(
                  data.overallGPA >= 3.5
                    ? 90
                    : data.overallGPA >= 3.0
                      ? 80
                      : data.overallGPA >= 2.0
                        ? 70
                        : 60
                )}`}
              >
                {data.overallGPA.toFixed(2)}
              </p>
              {gpaHistory && gpaHistory.length >= 2 && (
                <Sparkline data={gpaHistory} width={40} height={14} color="#6366f1" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">GPA</p>
          </div>
          {data.totalMissing > 0 && (
            <div className="text-center">
              <p className="text-[18px] font-semibold tabular-nums text-red-600">
                {data.totalMissing}
              </p>
              <p className="text-[10px] text-muted-foreground">Missing</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-[18px] font-semibold tabular-nums">
              {data.courses.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Courses</p>
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t bg-muted/5">
          {/* Alerts for this child */}
          {alerts.length > 0 && (
            <div className="px-5 pt-4 pb-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Alerts
              </p>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${alertSeverityColors[alert.severity]}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${alertSeverityDot[alert.severity]}`}
                    />
                    <div>
                      <p
                        className={`text-[12px] font-medium ${alertSeverityText[alert.severity]}`}
                      >
                        {alert.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                        {alert.actionable}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation scripts */}
          <ConversationCard script={script} />

          {/* Action items (fallback if no scripts) */}
          {script.items.length === 0 && topTodos.length > 0 && (
            <div className="px-5 pt-4 pb-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {criticalTodos.length > 0
                  ? `Follow up on — ${criticalTodos.length} overdue`
                  : "Top priorities"}
              </p>
              <div className="space-y-1">
                {topTodos.map((todo) => (
                  <div
                    key={todo.assignmentId}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ring-1 ring-inset flex-shrink-0 ${priorityColors[todo.priority]}`}
                    >
                      {todo.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {todo.assignmentName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {todo.courseName} · {todo.categoryName}
                        {todo.dueAt &&
                          (() => {
                            const d = new Date(todo.dueAt);
                            const now = new Date();
                            const diff = Math.ceil(
                              (d.getTime() - now.getTime()) /
                                (1000 * 60 * 60 * 24)
                            );
                            if (diff < 0) return ` · ${Math.abs(diff)}d overdue`;
                            if (diff === 0) return " · due today";
                            if (diff === 1) return " · due tomorrow";
                            return ` · due in ${diff}d`;
                          })()}
                      </p>
                    </div>
                    <span className="text-[12px] font-semibold text-emerald-600 tabular-nums flex-shrink-0">
                      +{todo.gradeDelta.toFixed(1)}%
                    </span>
                    {todo.thresholdCrossing && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20 flex-shrink-0">
                        {todo.thresholdCrossing}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak categories */}
          {weakCategories.length > 0 && (
            <div className="px-5 pt-2 pb-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Categories to watch — consistently below 75%
              </p>
              <div className="flex flex-wrap gap-2">
                {weakCategories.map((wc, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/15 text-[12px]"
                  >
                    <span className="font-medium text-red-800 dark:text-red-300">
                      {wc.category}
                    </span>
                    <span className="text-red-600/70 dark:text-red-400/70">{wc.course}</span>
                    <span className="font-semibold text-red-700 dark:text-red-400 tabular-nums">
                      {wc.avg.toFixed(0)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk courses */}
          {riskyCourses.length > 0 && (
            <div className="px-5 pt-2 pb-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Near a letter grade boundary
              </p>
              <div className="flex flex-wrap gap-2">
                {riskyCourses.map((course) => (
                  <span
                    key={course}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/15 text-[12px] font-medium text-amber-800 dark:text-amber-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {course}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Course grades grid */}
          <div className="px-5 pt-2 pb-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              All courses
            </p>
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
              {data.courses
                .sort((a, b) => a.currentGrade - b.currentGrade)
                .map((course) => {
                  const forecast = data.forecasts.find(
                    (f) => f.courseId === course.courseId
                  );
                  return (
                    <div
                      key={course.courseId}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground truncate">
                          {course.courseName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[12px] font-semibold tabular-nums ${gradeColor(course.currentGrade)}`}
                          >
                            {course.currentGrade.toFixed(0)}% (
                            {course.letterGrade})
                          </span>
                          {forecast &&
                            Math.abs(
                              forecast.projectedFinalGrade -
                                course.currentGrade
                            ) > 1 && (
                              <span
                                className={`text-[10px] ${
                                  forecast.projectedFinalGrade >
                                  course.currentGrade
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {forecast.projectedFinalGrade >
                                course.currentGrade
                                  ? "trending up"
                                  : "trending down"}
                              </span>
                            )}
                        </div>
                      </div>
                      {course.missingCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10 flex-shrink-0">
                          {course.missingCount} missing
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Link to individual dashboard */}
          <div className="px-5 pb-4">
            <Link
              href="/dashboard"
              className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View {child.student.name}&apos;s full dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Green child — collapsed "all good" row
function GreenChildRow({
  child,
  health,
}: {
  child: ChildData;
  health: ChildHealthScore;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data } = child;

  if (expanded) {
    return (
      <ChildCard
        child={child}
        health={health}
        script={{ childName: child.student.name, items: [] }}
        alerts={[]}
        defaultExpanded={true}
      />
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="w-full rounded-xl border bg-card shadow-sm shadow-black/[0.04] px-5 py-3 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
    >
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400/60 to-emerald-500 flex items-center justify-center flex-shrink-0">
        <span className="text-[12px] font-bold text-white">
          {child.student.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <p className="text-[14px] font-medium text-foreground flex-1">
        {child.student.name}
      </p>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ring-inset bg-emerald-50 dark:bg-emerald-500/10 ring-emerald-600/10 text-emerald-700 dark:text-emerald-400">
        All good
      </span>
      <span className="text-[14px] font-semibold tabular-nums text-emerald-600">
        {data.overallGPA.toFixed(2)}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {data.courses.length} courses · 0 missing
      </span>
      <svg
        className="w-3 h-3 text-muted-foreground flex-shrink-0"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function buildQuickInsight(child: ChildData, health: ChildHealthScore): string {
  const { data } = child;
  const critical = data.todos.filter((t) => t.priority === "critical");

  if (critical.length > 0) {
    const courses = [...new Set(critical.map((t) => t.courseName))];
    return `${critical.length} overdue in ${courses.join(", ")}`;
  }

  if (data.totalMissing > 0) {
    return `${data.totalMissing} missing — biggest: "${data.todos[0]?.assignmentName}"`;
  }

  const weakest = [...data.courses].sort(
    (a, b) => a.currentGrade - b.currentGrade
  )[0];
  if (weakest && weakest.currentGrade < 80) {
    return `${weakest.courseName} at ${weakest.currentGrade.toFixed(0)}%`;
  }

  return "";
}

// === Main Component ===

export function FamilyDashboard({
  children,
  fetchedAt,
}: {
  children: ChildData[];
  fetchedAt?: Date;
}) {
  const [deltas, setDeltas] = useState<GradeDelta[]>([]);
  const [childHistories, setChildHistories] = useState<Map<string, GradeSnapshot[]>>(new Map());

  // Compute health scores
  const childHealthMap = new Map<string, ChildHealthScore>();
  for (const child of children) {
    childHealthMap.set(child.student.id, calculateHealthScore(child.data));
  }

  // Compute alerts per child
  const childAlertsMap = new Map<string, PredictiveAlert[]>();
  for (const child of children) {
    childAlertsMap.set(child.student.id, generateAlerts(child.data));
  }

  // Compute conversation scripts per child
  const childScriptsMap = new Map<string, ConversationScript>();
  for (const child of children) {
    childScriptsMap.set(
      child.student.id,
      generateConversationScripts(child.student.name, child.data.todos)
    );
  }

  // Snapshot + delta computation (client-side only)
  useEffect(() => {
    const computed: GradeDelta[] = [];
    for (const child of children) {
      const delta = computeDelta(
        child.student.id,
        child.student.name,
        child.data
      );
      if (delta) computed.push(delta);
    }
    setDeltas(computed);

    // Save snapshots AFTER computing deltas (so next visit has fresh comparison)
    for (const child of children) {
      saveSnapshot(child.student.id, child.data);
    }

    // Load snapshot histories for sparklines
    const histories = new Map<string, GradeSnapshot[]>();
    for (const child of children) {
      histories.set(child.student.id, getSnapshotHistory(child.student.id));
    }
    setChildHistories(histories);
  }, [children]);

  // Separate green vs non-green children
  const nonGreen = children.filter(
    (c) => childHealthMap.get(c.student.id)?.level !== "green"
  );
  const green = children.filter(
    (c) => childHealthMap.get(c.student.id)?.level === "green"
  );

  // Sort non-green by health score (lowest first = needs most help)
  nonGreen.sort(
    (a, b) =>
      (childHealthMap.get(a.student.id)?.score ?? 0) -
      (childHealthMap.get(b.student.id)?.score ?? 0)
  );

  // Aggregate stats
  const totalMissing = children.reduce((s, c) => s + c.data.totalMissing, 0);
  const totalCritical = children.reduce(
    (s, c) =>
      s + c.data.todos.filter((t) => t.priority === "critical").length,
    0
  );
  const avgGPA =
    children.length > 0
      ? Math.round(
          (children.reduce((s, c) => s + c.data.overallGPA, 0) /
            children.length) *
            100
        ) / 100
      : 0;
  const avgHealth =
    children.length > 0
      ? Math.round(
          children.reduce(
            (s, c) => s + (childHealthMap.get(c.student.id)?.score ?? 0),
            0
          ) / children.length
        )
      : 0;

  // All alerts flattened + deduped
  const allAlerts = children.flatMap(
    (c) => childAlertsMap.get(c.student.id) ?? []
  );

  // Build headline — exception-based
  let headline: string;
  let subtitle: string;

  if (nonGreen.length === 0) {
    headline = "Everyone's in good shape";
    subtitle = `No missing work, no overdue assignments. Average GPA: ${avgGPA.toFixed(2)}. Go do something else.`;
  } else if (totalCritical > 0) {
    const criticalKids = children
      .filter((c) =>
        c.data.todos.some((t) => t.priority === "critical")
      )
      .map((c) => c.student.name);
    headline = `${criticalKids.join(" and ")} ${criticalKids.length > 1 ? "need" : "needs"} attention now`;
    subtitle = `${totalCritical} overdue assignment${totalCritical > 1 ? "s" : ""} — every day late costs more points.`;
  } else {
    headline = `${nonGreen.length} kid${nonGreen.length > 1 ? "s" : ""} to check in on`;
    subtitle = `${totalMissing} missing assignment${totalMissing > 1 ? "s" : ""} being counted as zeros.`;
  }

  // Trust signal
  const updatedAgo = fetchedAt
    ? formatUpdatedAgo(fetchedAt)
    : "just now";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Headline + trust signal */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {headline}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
            Data from Canvas · Updated {updatedAgo}
          </span>
        </div>
      </div>

      {/* What Changed — diff from last visit */}
      {deltas.length > 0 && <DeltaView deltas={deltas} />}

      {/* Predictive Alerts — top-level feed */}
      {allAlerts.length > 0 && (
        <div>
          <h2 className="text-[14px] font-semibold mb-2">Alerts</h2>
          <AlertFeed alerts={allAlerts} />
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm shadow-black/[0.04]">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            Family Health
          </p>
          <p className="text-2xl font-semibold tracking-tight mt-1">
            {avgHealth}
            <span className="text-[14px] text-muted-foreground font-normal">
              /100
            </span>
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            {nonGreen.length === 0
              ? "Everyone green"
              : `${nonGreen.length} need${nonGreen.length > 1 ? "" : "s"} a check-in`}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm shadow-black/[0.04]">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            Average GPA
          </p>
          <p className="text-2xl font-semibold tracking-tight mt-1">
            {avgGPA.toFixed(2)}
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            Across all{" "}
            {children.reduce((s, c) => s + c.data.courses.length, 0)}{" "}
            courses
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm shadow-black/[0.04]">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            Missing Work
          </p>
          <p
            className={`text-2xl font-semibold tracking-tight mt-1 ${totalMissing > 0 ? "text-red-600" : "text-foreground"}`}
          >
            {totalMissing}
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            {totalMissing > 0
              ? `${totalMissing} zero${totalMissing > 1 ? "s" : ""} in the gradebook`
              : "Nothing missing"}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm shadow-black/[0.04]">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
            Overdue
          </p>
          <p
            className={`text-2xl font-semibold tracking-tight mt-1 ${totalCritical > 0 ? "text-red-600" : "text-foreground"}`}
          >
            {totalCritical}
          </p>
          <p className="text-[12px] text-muted-foreground mt-1.5">
            {totalCritical > 0
              ? "Past due and losing points daily"
              : "Nothing overdue"}
          </p>
        </div>
      </div>

      {/* Non-green children — expanded with full detail */}
      {nonGreen.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-semibold">
              {nonGreen.length > 1
                ? "Sorted by who needs the most attention"
                : ""}
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Click to expand details
            </p>
          </div>
          <div className="space-y-3">
            {nonGreen.map((child) => (
              <ChildCard
                key={child.student.id}
                child={child}
                health={childHealthMap.get(child.student.id)!}
                script={childScriptsMap.get(child.student.id)!}
                alerts={childAlertsMap.get(child.student.id) ?? []}
                defaultExpanded={
                  (childHealthMap.get(child.student.id)?.level ?? "green") ===
                  "red"
                }
                gpaHistory={childHistories.get(child.student.id)?.map((s) => s.overallGPA)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Green children — collapsed one-liners */}
      {green.length > 0 && (
        <div>
          {nonGreen.length > 0 && (
            <h2 className="text-[15px] font-semibold mb-3">
              Looking good
            </h2>
          )}
          <div className="space-y-2">
            {green.map((child) => (
              <GreenChildRow
                key={child.student.id}
                child={child}
                health={childHealthMap.get(child.student.id)!}
              />
            ))}
          </div>
        </div>
      )}
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

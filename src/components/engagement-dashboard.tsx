"use client";

import type { EngagementAnalysis } from "@/lib/types";
import { DayHeatmap } from "@/components/day-heatmap";
import { SubmissionTimeline } from "@/components/submission-timeline";
import { PeriodComparisonCards } from "@/components/period-comparison";

const SEVERITY_STYLES = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
    text: "text-red-800",
    subtext: "text-red-700",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-800",
    subtext: "text-amber-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
    text: "text-blue-800",
    subtext: "text-blue-700",
  },
};

const LEVEL_STYLES = {
  green: { bg: "bg-emerald-500", text: "text-white" },
  yellow: { bg: "bg-amber-500", text: "text-white" },
  red: { bg: "bg-red-500", text: "text-white" },
};

export function EngagementDashboard({ analysis }: { analysis: EngagementAnalysis }) {
  const levelStyle = LEVEL_STYLES[analysis.level];

  // Collect missed assignments for the timeline
  const missedDueDates: { dueAt: string; assignmentName: string; courseName: string }[] = [];
  // We don't have direct access to missed items from analysis, but we can infer from heatmap data
  // For now, timeline only shows submitted points

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-foreground">{analysis.studentName}</h1>
          <p className="text-[13px] text-muted-foreground">
            Engagement Analysis · {analysis.timingPoints.length} submissions tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground font-medium">Engagement</p>
            <p className="text-[11px] text-muted-foreground">
              {analysis.timingTrendSlope > 0
                ? "Trending earlier"
                : analysis.timingTrendSlope < -1
                ? "Trending later"
                : "Stable timing"}
            </p>
          </div>
          <div
            className={`h-12 w-12 rounded-full ${levelStyle.bg} flex items-center justify-center`}
          >
            <span className={`text-[16px] font-bold ${levelStyle.text}`}>
              {analysis.engagementScore}
            </span>
          </div>
        </div>
      </div>

      {/* Signal cards */}
      {analysis.signals.length > 0 && (
        <div className="space-y-2">
          {analysis.signals.map((signal, i) => {
            const style = SEVERITY_STYLES[signal.severity];
            return (
              <div
                key={i}
                className={`rounded-lg border ${style.border} ${style.bg} px-4 py-3`}
              >
                <div className="flex items-start gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot} mt-1.5 flex-shrink-0`} />
                  <div>
                    <p className={`text-[13px] font-semibold ${style.text}`}>{signal.title}</p>
                    <p className={`text-[12px] ${style.subtext} mt-0.5`}>{signal.detail}</p>
                    <p className="text-[12px] text-muted-foreground mt-1">{signal.actionable}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Period comparisons */}
      <PeriodComparisonCards wow={analysis.wow} mom={analysis.mom} />

      {/* Heatmap + Day patterns side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DayHeatmap data={analysis.heatmapData} />

        {/* Day-of-week summary */}
        <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-[14px] font-semibold text-foreground">Day-of-Week Summary</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Which days are problematic?
            </p>
          </div>
          <div className="px-5 pb-4">
            <div className="space-y-1.5">
              {analysis.dayPatterns.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={`flex items-center justify-between py-1.5 px-3 rounded-md ${
                    day.isProblematic ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        day.isProblematic ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-[13px] font-medium text-foreground">{day.dayName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-muted-foreground">{day.totalDue} due</span>
                    <span className="text-emerald-600">{day.onTimeCount} on-time</span>
                    {day.lateCount > 0 && (
                      <span className="text-amber-600">{day.lateCount} late</span>
                    )}
                    {day.missedCount > 0 && (
                      <span className="text-red-600">{day.missedCount} missed</span>
                    )}
                    <span className="text-muted-foreground tabular-nums w-14 text-right">
                      {day.avgHoursBeforeDeadline > 0
                        ? `${day.avgHoursBeforeDeadline}h early`
                        : day.avgHoursBeforeDeadline < 0
                        ? `${Math.abs(day.avgHoursBeforeDeadline)}h late`
                        : "on time"}
                    </span>
                  </div>
                </div>
              ))}
              {analysis.dayPatterns.length === 0 && (
                <p className="text-[12px] text-muted-foreground py-2">No day patterns detected yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-width timeline */}
      <SubmissionTimeline points={analysis.timingPoints} />
    </div>
  );
}

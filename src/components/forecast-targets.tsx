"use client";

import { useState } from "react";
import { CourseForecast } from "@/lib/types";

function gradeColor(grade: number): string {
  if (grade >= 90) return "text-emerald-600";
  if (grade >= 80) return "text-blue-600";
  if (grade >= 70) return "text-amber-600";
  return "text-red-600";
}

function buildInsight(forecast: CourseForecast): string {
  const { riskCategory, targets, projectedFinalGrade } = forecast;

  // Find the next achievable letter grade up
  const nextUp = targets.find(
    (t) => t.feasible && t.minGrade > projectedFinalGrade
  );

  // Find the current letter grade threshold
  const currentThreshold = [...targets]
    .filter((t) => t.minGrade <= projectedFinalGrade)
    .sort((a, b) => b.minGrade - a.minGrade)[0];

  const parts: string[] = [];

  // How close to the next grade up?
  if (nextUp) {
    const gap = nextUp.minGrade - projectedFinalGrade;
    if (gap < 3) {
      parts.push(
        `Only ${gap.toFixed(1)}% away from ${nextUp.letter} — averaging ${nextUp.requiredAverage.toFixed(0)}% on remaining work gets you there`
      );
    } else {
      parts.push(
        `${nextUp.letter} requires averaging ${nextUp.requiredAverage.toFixed(0)}% on remaining work`
      );
    }
  }

  // How close to dropping?
  if (currentThreshold) {
    const margin = projectedFinalGrade - currentThreshold.minGrade;
    if (margin < 3 && margin > 0) {
      parts.push(
        `${margin.toFixed(1)}% margin above ${currentThreshold.letter} — a low score could drop it`
      );
    }
  }

  // Risk category callout
  if (riskCategory && riskCategory.riskScore > 0.08) {
    const avgNote =
      riskCategory.gradedCount > 0
        ? ` (averaging ${riskCategory.averageScore.toFixed(0)}%)`
        : "";
    parts.push(
      `${riskCategory.groupName}${avgNote} carries the most risk with ${riskCategory.remainingCount} assignment${riskCategory.remainingCount > 1 ? "s" : ""} left`
    );
  }

  return parts.join(". ") + (parts.length > 0 ? "." : "");
}

function ForecastRow({ forecast }: { forecast: CourseForecast }) {
  const [expanded, setExpanded] = useState(false);
  const insight = buildInsight(forecast);

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-foreground truncate">
            {forecast.courseName}
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            Trending toward{" "}
            <span className={`font-semibold ${gradeColor(forecast.projectedFinalGrade)}`}>
              {forecast.projectedFinalGrade.toFixed(1)}% ({forecast.projectedLetterGrade})
            </span>
            {insight && <span className="text-muted-foreground/70"> — {insight}</span>}
          </p>
        </div>

        {forecast.riskCategory && forecast.riskCategory.riskScore > 0.05 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/20 flex-shrink-0">
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            {forecast.riskCategory.groupName}
          </span>
        )}

        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t bg-muted/10">
          {/* Grade targets table */}
          <div className="mt-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
              What you need to score on remaining work
            </p>
            <div className="space-y-1">
              {forecast.targets.map((target) => {
                const isCurrentOrBelow = target.minGrade <= forecast.projectedFinalGrade;
                const isNextUp = !isCurrentOrBelow &&
                  target === forecast.targets.find(
                    (t) => t.feasible && t.minGrade > forecast.projectedFinalGrade
                  );

                return (
                  <div
                    key={target.letter}
                    className={`flex items-center gap-3 py-1.5 px-2 rounded-md ${
                      isNextUp ? "bg-primary/5 ring-1 ring-primary/10" : ""
                    }`}
                  >
                    <span className={`text-[12px] font-semibold w-6 ${isNextUp ? "text-primary" : ""}`}>
                      {target.letter}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          target.feasible
                            ? target.requiredAverage <= 70
                              ? "bg-emerald-500"
                              : target.requiredAverage <= 90
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            : "bg-red-300"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, target.requiredAverage))}%`,
                          opacity: target.feasible ? 0.7 : 0.3,
                        }}
                      />
                    </div>
                    <span
                      className={`text-[12px] tabular-nums w-20 text-right ${
                        target.feasible
                          ? isCurrentOrBelow
                            ? "text-emerald-600 font-medium"
                            : "font-medium text-foreground"
                          : "text-muted-foreground line-through"
                      }`}
                    >
                      {!target.feasible
                        ? "out of reach"
                        : isCurrentOrBelow
                          ? "on track"
                          : `avg ${target.requiredAverage.toFixed(0)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category trends */}
          {forecast.categoryTrends.some((t) => t.gradedCount > 0) && (
            <div className="mt-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Where you're strong vs. where to focus
              </p>
              <div className="space-y-1.5">
                {forecast.categoryTrends
                  .filter((t) => t.gradedCount > 0)
                  .sort((a, b) => a.averageScore - b.averageScore)
                  .map((trend) => {
                    const isWeak = trend.averageScore < 75;
                    const isStrong = trend.averageScore >= 90;
                    return (
                      <div
                        key={trend.groupId}
                        className="flex items-center gap-3 py-1"
                      >
                        <span className="text-[12px] text-muted-foreground truncate flex-1">
                          {trend.groupName}
                          {trend.weight > 0 && (
                            <span className="text-muted-foreground/50"> · {trend.weight}% of grade</span>
                          )}
                        </span>
                        <span className={`text-[12px] font-semibold tabular-nums ${gradeColor(trend.averageScore)}`}>
                          {trend.averageScore.toFixed(0)}%
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums w-20 text-right">
                          {trend.remainingCount > 0
                            ? `${trend.remainingCount} left`
                            : "complete"}
                        </span>
                        {isWeak && trend.weight >= 10 && (
                          <span className="text-[10px] font-medium text-red-600">needs work</span>
                        )}
                        {isStrong && (
                          <span className="text-[10px] font-medium text-emerald-600">strong</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ForecastTargets({
  forecasts,
}: {
  forecasts: CourseForecast[];
}) {
  if (forecasts.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[15px] font-semibold">Grade forecast</h2>
        <p className="text-[12px] text-muted-foreground">
          Where each course is heading based on your performance patterns
        </p>
      </div>
      <div className="space-y-2">
        {forecasts
          .sort((a, b) => a.projectedFinalGrade - b.projectedFinalGrade)
          .map((f) => (
            <ForecastRow key={f.courseId} forecast={f} />
          ))}
      </div>
    </div>
  );
}

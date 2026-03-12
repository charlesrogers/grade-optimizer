"use client";

import { GradeBreakdown, CourseForecast } from "@/lib/types";
import { Sparkline } from "@/components/sparkline";

function gradeColor(grade: number): string {
  if (grade >= 90) return "text-emerald-600";
  if (grade >= 80) return "text-blue-600";
  if (grade >= 70) return "text-amber-600";
  if (grade >= 60) return "text-orange-600";
  return "text-red-600";
}

function gradeBg(grade: number): string {
  if (grade >= 90) return "bg-emerald-500";
  if (grade >= 80) return "bg-blue-500";
  if (grade >= 70) return "bg-amber-500";
  if (grade >= 60) return "bg-orange-500";
  return "bg-red-500";
}

function letterBadge(letter: string, grade: number) {
  const bg =
    grade >= 90
      ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20"
      : grade >= 80
        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ring-blue-600/20"
        : grade >= 70
          ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 ring-amber-600/20"
          : grade >= 60
            ? "bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 ring-orange-600/20"
            : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 ring-red-600/20";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ring-inset ${bg}`}
    >
      {letter}
    </span>
  );
}

export function CourseCard({
  breakdown,
  forecast,
  gradeHistory,
}: {
  breakdown: GradeBreakdown;
  forecast?: CourseForecast;
  gradeHistory?: number[];
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden hover:shadow-md hover:shadow-black/[0.06] transition-shadow">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2">
            {breakdown.courseName}
          </h3>
          {letterBadge(breakdown.letterGrade, breakdown.currentGrade)}
        </div>

        {/* Grade display */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`text-2xl font-semibold tracking-tight ${gradeColor(breakdown.currentGrade)}`}
          >
            {breakdown.currentGrade.toFixed(1)}%
          </span>
          {gradeHistory && gradeHistory.length >= 2 && (
            <Sparkline
              data={gradeHistory}
              width={48}
              height={16}
              color={breakdown.currentGrade >= 90 ? "#10b981" : breakdown.currentGrade >= 80 ? "#3b82f6" : breakdown.currentGrade >= 70 ? "#f59e0b" : "#ef4444"}
            />
          )}
          {breakdown.projectedGrade < breakdown.currentGrade && (
            <span className="text-[12px] text-muted-foreground">
              {breakdown.projectedGrade.toFixed(1)}% projected
            </span>
          )}
        </div>

        {/* Forecast trend */}
        {forecast && (
          <div className="mt-1.5">
            <p className="text-[12px] text-muted-foreground">
              Heading toward{" "}
              <span className="font-medium text-foreground">
                {forecast.projectedFinalGrade.toFixed(1)}% ({forecast.projectedLetterGrade})
              </span>
              {forecast.projectedLetterGrade !== breakdown.letterGrade && (
                <span className={forecast.projectedFinalGrade > breakdown.currentGrade ? "text-emerald-600" : "text-red-600"}>
                  {" "}{forecast.projectedFinalGrade > breakdown.currentGrade ? "trending up" : "trending down"}
                </span>
              )}
            </p>
            {forecast.riskCategory && forecast.riskCategory.riskScore > 0.1 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Watch {forecast.riskCategory.groupName} — {forecast.riskCategory.remainingCount} assignment{forecast.riskCategory.remainingCount > 1 ? "s" : ""} left, big weight
              </p>
            )}
          </div>
        )}

        {/* Missing alert */}
        {breakdown.missingCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-[12px] font-medium text-red-700 dark:text-red-300">
              {breakdown.missingCount} missing — {breakdown.missingCount === 1 ? "that's a" : "those are"} zero{breakdown.missingCount > 1 ? "s" : ""} in the gradebook
            </span>
            {breakdown.potentialGain > 0 && (
              <span className="text-[12px] text-red-600/70 ml-auto whitespace-nowrap">
                +{breakdown.potentialGain.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Category bars */}
      <div className="px-5 pb-4 pt-1 space-y-2">
        {breakdown.categoryBreakdowns
          .filter((c) => c.possible > 0 || c.missingCount > 0)
          .map((cat) => {
            const trend = forecast?.categoryTrends.find(
              (t) => t.groupId === cat.groupId
            );
            return (
            <div key={cat.groupId}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-muted-foreground truncate mr-2">
                  {cat.groupName}
                  {cat.weight > 0 && (
                    <span className="text-muted-foreground/60"> {cat.weight}%</span>
                  )}
                  {trend && trend.gradedCount > 0 && (
                    <span className="text-muted-foreground/50"> avg {trend.averageScore.toFixed(0)}%</span>
                  )}
                </span>
                <span className="text-[11px] font-medium tabular-nums flex-shrink-0">
                  {cat.possible > 0 ? `${cat.categoryGrade.toFixed(0)}%` : "—"}
                  {cat.missingCount > 0 && (
                    <span className="text-red-500 ml-1">
                      {cat.missingCount}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    cat.possible > 0 ? gradeBg(cat.categoryGrade) : "bg-muted"
                  }`}
                  style={{
                    width: `${cat.possible > 0 ? Math.min(100, cat.categoryGrade) : 0}%`,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
            );
          })}
      </div>
    </div>
  );
}

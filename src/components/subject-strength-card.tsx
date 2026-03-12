"use client";

import type { SubjectSummary } from "@/lib/types";
import { Sparkline } from "@/components/sparkline";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const strengthColors = {
  strong: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  average: { border: "border-gray-200", bg: "bg-gray-50", text: "text-gray-600", badge: "bg-gray-100 text-gray-700" },
  weak: { border: "border-red-200", bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-800" },
};

const sparklineColors = {
  strong: "#10b981",
  average: "#6b7280",
  weak: "#ef4444",
};

export function SubjectStrengthCard({ summary }: { summary: SubjectSummary }) {
  const colors = strengthColors[summary.strengthLabel];
  const sparkColor = sparklineColors[summary.strengthLabel];
  const gradeValues = summary.grades.map((g) => g.grade);

  const TrendIcon =
    summary.trend === "improving" ? TrendingUp :
    summary.trend === "declining" ? TrendingDown : Minus;

  const trendColor =
    summary.trend === "improving" ? "text-emerald-600" :
    summary.trend === "declining" ? "text-red-600" : "text-gray-400";

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">{summary.category}</h3>
          <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}>
            {summary.strengthLabel}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-bold tabular-nums text-foreground">
            {summary.averageGrade}%
          </p>
          <div className={`flex items-center gap-1 justify-end ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-[11px] font-medium capitalize">{summary.trend}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Sparkline data={gradeValues} width={80} height={24} color={sparkColor} />
        <span className="text-[11px] text-muted-foreground">
          {summary.courseCount} course{summary.courseCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

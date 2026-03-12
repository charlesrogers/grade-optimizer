"use client";

import type { PeriodComparison } from "@/lib/types";

function DeltaBadge({ value, inverted = false }: { value: number; inverted?: boolean }) {
  // For timing: positive = improving (earlier), negative = worse
  // For missing/late: inverted - positive = worse, negative = better
  const isGood = inverted ? value <= 0 : value >= 0;
  const arrow = value > 0 ? "\u2191" : value < 0 ? "\u2193" : "";
  const display = Math.abs(value);

  if (value === 0) {
    return <span className="text-[11px] text-muted-foreground font-medium">--</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        isGood ? "text-emerald-600" : "text-red-600"
      }`}
    >
      {arrow} {display}
    </span>
  );
}

function MetricRow({ label, current, previous, delta, inverted = false, suffix = "" }: {
  label: string;
  current: string;
  previous: string;
  delta: number;
  inverted?: boolean;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[12px] text-muted-foreground">{previous}{suffix}</span>
        <span className="text-[12px] text-muted-foreground">&rarr;</span>
        <span className="text-[12px] font-semibold text-foreground">{current}{suffix}</span>
        <DeltaBadge value={delta} inverted={inverted} />
      </div>
    </div>
  );
}

export function PeriodComparisonCards({ wow, mom }: { wow: PeriodComparison; mom: PeriodComparison }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PeriodCard comparison={wow} />
      <PeriodCard comparison={mom} />
    </div>
  );
}

function PeriodCard({ comparison }: { comparison: PeriodComparison }) {
  const { current, previous } = comparison;
  const hasData = current.totalDue > 0 || previous.totalDue > 0;

  if (!hasData) {
    return (
      <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
        <h3 className="text-[13px] font-semibold text-foreground mb-1">{comparison.label}</h3>
        <p className="text-[12px] text-muted-foreground">No data for this period yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-foreground">{comparison.label}</h3>
        <span className="text-[11px] text-muted-foreground">
          {previous.period} &rarr; {current.period}
        </span>
      </div>

      <div className="divide-y">
        <MetricRow
          label="Avg timing"
          previous={`${previous.avgHoursBeforeDeadline}h`}
          current={`${current.avgHoursBeforeDeadline}h`}
          delta={comparison.timingDelta}
          suffix=" early"
        />
        <MetricRow
          label="Late"
          previous={String(previous.lateCount)}
          current={String(current.lateCount)}
          delta={current.lateCount - previous.lateCount}
          inverted
        />
        <MetricRow
          label="Missing"
          previous={String(previous.missedCount)}
          current={String(current.missedCount)}
          delta={comparison.missingDelta}
          inverted
        />
        {comparison.scoreDelta !== null && (
          <MetricRow
            label="Avg score"
            previous={previous.avgScorePercent !== null ? `${previous.avgScorePercent}%` : "--"}
            current={current.avgScorePercent !== null ? `${current.avgScorePercent}%` : "--"}
            delta={comparison.scoreDelta}
          />
        )}
      </div>
    </div>
  );
}

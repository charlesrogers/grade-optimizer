"use client";

import { useState } from "react";
import type { SubmissionTimingPoint } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  if (points.length < 2) return { slope: 0, intercept: 0 };
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.x, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.x - meanX) * (p.y - meanY);
    den += (p.x - meanX) * (p.x - meanX);
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  return { slope, intercept };
}

export function SubmissionTimeline({
  points,
  missedDueDates,
}: {
  points: SubmissionTimingPoint[];
  missedDueDates?: { dueAt: string; assignmentName: string; courseName: string }[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 text-center">
        <p className="text-[13px] text-muted-foreground">Not enough submission data for timeline.</p>
      </div>
    );
  }

  const W = 700;
  const H = 220;
  const padLeft = 50;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 32;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  // X-axis: time range from earliest to latest due date
  const allDates = points.map((p) => Date.parse(p.dueAt));
  if (missedDueDates) {
    for (const m of missedDueDates) allDates.push(Date.parse(m.dueAt));
  }
  const minTime = Math.min(...allDates);
  const maxTime = Math.max(...allDates);
  const timeRange = maxTime - minTime || 1;

  // Y-axis: hours before deadline
  const allHours = points.map((p) => p.hoursBeforeDeadline);
  const maxHours = Math.min(72, Math.max(...allHours) + 6);
  const minHours = Math.max(-24, Math.min(...allHours) - 3);
  const hoursRange = maxHours - minHours || 1;

  function toX(timestamp: number): number {
    return padLeft + ((timestamp - minTime) / timeRange) * innerW;
  }
  function toY(hours: number): number {
    return padTop + innerH - ((hours - minHours) / hoursRange) * innerH;
  }

  // Zero line (deadline)
  const zeroY = toY(0);

  // Y-axis ticks
  const yTicks: number[] = [];
  const step = hoursRange > 48 ? 12 : 6;
  for (let v = Math.ceil(minHours / step) * step; v <= maxHours; v += step) {
    yTicks.push(v);
  }

  // X-axis date labels (sample ~6)
  const xLabels: { time: number; label: string }[] = [];
  const dateStep = Math.max(1, Math.floor(points.length / 6));
  for (let i = 0; i < points.length; i += dateStep) {
    xLabels.push({ time: Date.parse(points[i].dueAt), label: formatDate(points[i].dueAt) });
  }

  // Linear regression for trend line
  const regPoints = points.map((p) => ({ x: Date.parse(p.dueAt), y: p.hoursBeforeDeadline }));
  const { slope, intercept } = linearRegression(regPoints);
  const trendX1 = minTime;
  const trendX2 = maxTime;
  const trendY1 = slope * trendX1 + intercept;
  const trendY2 = slope * trendX2 + intercept;

  const tooltipPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">Submission Timeline</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Hours before deadline · Above line = early, below = late
        </p>
      </div>
      <div className="px-3 pb-4 relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 240 }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Green zone above deadline */}
          <rect
            x={padLeft}
            y={padTop}
            width={innerW}
            height={Math.max(0, zeroY - padTop)}
            fill="#10b981"
            opacity="0.04"
          />
          {/* Red zone below deadline */}
          <rect
            x={padLeft}
            y={zeroY}
            width={innerW}
            height={Math.max(0, padTop + innerH - zeroY)}
            fill="#ef4444"
            opacity="0.04"
          />

          {/* Y-axis grid + labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={padLeft}
                y1={toY(v)}
                x2={W - padRight}
                y2={toY(v)}
                stroke="currentColor"
                strokeOpacity={v === 0 ? "0.3" : "0.08"}
                strokeWidth={v === 0 ? "1.5" : "1"}
              />
              <text
                x={padLeft - 6}
                y={toY(v) + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="9"
              >
                {v > 0 ? `${v}h` : v === 0 ? "Due" : `${Math.abs(v)}h late`}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map(({ time, label }, i) => (
            <text
              key={i}
              x={toX(time)}
              y={H - 4}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="8"
            >
              {label}
            </text>
          ))}

          {/* Trend line */}
          <line
            x1={toX(trendX1)}
            y1={toY(trendY1)}
            x2={toX(trendX2)}
            y2={toY(trendY2)}
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            opacity="0.6"
          />

          {/* Missing assignments (gray circles at bottom) */}
          {missedDueDates?.map((m, i) => (
            <circle
              key={`missed-${i}`}
              cx={toX(Date.parse(m.dueAt))}
              cy={toY(minHours + 2)}
              r={4}
              fill="#9ca3af"
              opacity="0.5"
              stroke="white"
              strokeWidth="1"
            />
          ))}

          {/* Data points */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={toX(Date.parse(pt.dueAt))}
              cy={toY(pt.hoursBeforeDeadline)}
              r={hoveredIdx === i ? 5 : 3.5}
              fill={pt.hoursBeforeDeadline >= 0 ? "#10b981" : "#ef4444"}
              stroke="white"
              strokeWidth="1.5"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          ))}

          {/* Hover rects for hit detection */}
          {points.map((_, i) => {
            const colW = innerW / points.length;
            return (
              <rect
                key={`hover-${i}`}
                x={toX(Date.parse(points[i].dueAt)) - colW / 2}
                y={padTop}
                width={colW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltipPoint && hoveredIdx !== null && (
          <div
            className="absolute bg-popover border rounded-lg shadow-lg px-3 py-2 pointer-events-none z-10"
            style={{
              left: `${(toX(Date.parse(tooltipPoint.dueAt)) / W) * 100}%`,
              top: 8,
              transform: hoveredIdx > points.length / 2 ? "translateX(-100%)" : "translateX(0)",
            }}
          >
            <p className="text-[11px] font-medium text-foreground">{tooltipPoint.assignmentName}</p>
            <p className="text-[10px] text-muted-foreground">{tooltipPoint.courseName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {tooltipPoint.hoursBeforeDeadline >= 0
                ? `${Math.round(tooltipPoint.hoursBeforeDeadline)}h early`
                : `${Math.round(Math.abs(tooltipPoint.hoursBeforeDeadline))}h late`}
            </p>
            {tooltipPoint.scorePercent !== null && (
              <p className="text-[10px] text-muted-foreground">
                Score: <span className="font-semibold text-foreground">{Math.round(tooltipPoint.scorePercent)}%</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">On-time</span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Late</span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-muted-foreground">Missing</span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px]">
          <span className="h-0.5 w-4 bg-indigo-500" style={{ borderTop: "1.5px dashed #6366f1" }} />
          <span className="text-muted-foreground">Trend</span>
        </span>
      </div>
    </div>
  );
}

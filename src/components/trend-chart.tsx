"use client";

import { useState } from "react";
import { GradeSnapshot } from "@/lib/types";

const COURSE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({ snapshots }: { snapshots: GradeSnapshot[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hiddenCourses, setHiddenCourses] = useState<Set<string>>(new Set());

  if (snapshots.length < 2) {
    return (
      <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 text-center">
        <p className="text-[13px] text-muted-foreground">
          Check back after your next visit to see grade trends over time.
        </p>
      </div>
    );
  }

  // Collect all unique courses
  const courseIds = new Map<string, string>();
  for (const snap of snapshots) {
    for (const c of snap.courses) {
      if (!courseIds.has(c.courseId)) {
        courseIds.set(c.courseId, c.courseName);
      }
    }
  }
  const courses = Array.from(courseIds.entries());

  // Compute data ranges
  const allGrades: number[] = [];
  for (const snap of snapshots) {
    allGrades.push(snap.overallGPA * 25); // Scale GPA to ~percentage for shared axis
    for (const c of snap.courses) {
      if (!hiddenCourses.has(c.courseId)) {
        allGrades.push(c.currentGrade);
      }
    }
  }
  // Use grade percentages for y-axis
  const allCourseGrades: number[] = [];
  for (const snap of snapshots) {
    for (const c of snap.courses) {
      if (!hiddenCourses.has(c.courseId)) {
        allCourseGrades.push(c.currentGrade);
      }
    }
  }
  const minGrade = Math.max(0, Math.min(...allCourseGrades) - 5);
  const maxGrade = Math.min(100, Math.max(...allCourseGrades) + 5);
  const gradeRange = maxGrade - minGrade || 1;

  // Chart dimensions
  const W = 600;
  const H = 200;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 28;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  function toX(i: number): number {
    return padLeft + (i / (snapshots.length - 1)) * innerW;
  }
  function toY(grade: number): number {
    return padTop + innerH - ((grade - minGrade) / gradeRange) * innerH;
  }

  // Y-axis tick marks
  const yTicks: number[] = [];
  const step = gradeRange > 20 ? 10 : 5;
  for (let v = Math.ceil(minGrade / step) * step; v <= maxGrade; v += step) {
    yTicks.push(v);
  }

  // Build polylines per course
  const courseLines = courses
    .filter(([id]) => !hiddenCourses.has(id))
    .map(([id, name], ci) => {
      const pts = snapshots
        .map((snap, i) => {
          const c = snap.courses.find((c) => c.courseId === id);
          if (!c) return null;
          return `${toX(i)},${toY(c.currentGrade)}`;
        })
        .filter(Boolean)
        .join(" ");
      return { id, name, pts, color: COURSE_COLORS[ci % COURSE_COLORS.length] };
    });

  // Toggle course visibility
  const toggleCourse = (courseId: string) => {
    setHiddenCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  // Tooltip data
  const tooltipSnap = hoveredIdx !== null ? snapshots[hoveredIdx] : null;

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">Grade Trends</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {snapshots.length} snapshots · {formatDate(snapshots[0].timestamp)} to {formatDate(snapshots[snapshots.length - 1].timestamp)}
        </p>
      </div>

      <div className="px-3 pb-2 relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 220 }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Y-axis grid + labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={padLeft}
                y1={toY(v)}
                x2={W - padRight}
                y2={toY(v)}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeWidth="1"
              />
              <text
                x={padLeft - 6}
                y={toY(v) + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="9"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* X-axis date labels */}
          {snapshots.map((snap, i) => (
            <text
              key={i}
              x={toX(i)}
              y={H - 4}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="8"
            >
              {formatDate(snap.timestamp)}
            </text>
          ))}

          {/* Course lines */}
          {courseLines.map((cl) => (
            <polyline
              key={cl.id}
              points={cl.pts}
              fill="none"
              stroke={cl.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          ))}

          {/* Hover columns (invisible rects for hit detection) */}
          {snapshots.map((_, i) => {
            const colW = innerW / snapshots.length;
            return (
              <rect
                key={i}
                x={toX(i) - colW / 2}
                y={padTop}
                width={colW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
                onTouchStart={() => setHoveredIdx(i)}
              />
            );
          })}

          {/* Hover line */}
          {hoveredIdx !== null && (
            <line
              x1={toX(hoveredIdx)}
              y1={padTop}
              x2={toX(hoveredIdx)}
              y2={padTop + innerH}
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          )}

          {/* Hover dots */}
          {hoveredIdx !== null &&
            courseLines.map((cl) => {
              const snap = snapshots[hoveredIdx];
              const c = snap.courses.find((c) => c.courseId === cl.id);
              if (!c) return null;
              return (
                <circle
                  key={cl.id}
                  cx={toX(hoveredIdx)}
                  cy={toY(c.currentGrade)}
                  r={3.5}
                  fill={cl.color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              );
            })}
        </svg>

        {/* Tooltip */}
        {tooltipSnap && hoveredIdx !== null && (
          <div
            className="absolute bg-popover border rounded-lg shadow-lg px-3 py-2 pointer-events-none z-10"
            style={{
              left: `${((toX(hoveredIdx)) / W) * 100}%`,
              top: 8,
              transform: hoveredIdx > snapshots.length / 2 ? "translateX(-100%)" : "translateX(0)",
            }}
          >
            <p className="text-[11px] font-medium text-foreground mb-1">
              {formatDate(tooltipSnap.timestamp)}
            </p>
            <p className="text-[11px] text-muted-foreground mb-1">
              GPA: <span className="font-semibold text-foreground">{tooltipSnap.overallGPA.toFixed(2)}</span>
            </p>
            {tooltipSnap.courses
              .filter((c) => !hiddenCourses.has(c.courseId))
              .map((c) => {
                const ci = courses.findIndex(([id]) => id === c.courseId);
                const col = COURSE_COLORS[ci % COURSE_COLORS.length];
                return (
                  <p key={c.courseId} className="text-[10px] flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: col }} />
                    <span className="text-muted-foreground truncate">{c.courseName}</span>
                    <span className="font-semibold tabular-nums ml-auto">{c.currentGrade.toFixed(1)}%</span>
                  </p>
                );
              })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex flex-wrap gap-3">
        {courses.map(([id, name], ci) => {
          const isHidden = hiddenCourses.has(id);
          const color = COURSE_COLORS[ci % COURSE_COLORS.length];
          return (
            <button
              key={id}
              onClick={() => toggleCourse(id)}
              className={`flex items-center gap-1.5 text-[11px] transition-opacity ${isHidden ? "opacity-30" : "opacity-100"}`}
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

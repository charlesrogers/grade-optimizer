"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import type { DayOfWeekCell } from "@/lib/types";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_INDEX = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun mapped to JS day indices

export function DayHeatmap({ data }: { data: DayOfWeekCell[] }) {
  const [hovered, setHovered] = useState<DayOfWeekCell | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const { resolvedTheme } = useTheme();

  const LEVEL_COLORS: Record<string, string> = {
    green: "#10b981",
    yellow: "#f59e0b",
    red: "#ef4444",
    gray: resolvedTheme === "dark" ? "#1e293b" : "#f3f4f6",
  };

  // Get unique weeks in order (most recent first for display)
  const weeks = Array.from(new Set(data.map((d) => d.weekStart))).sort().reverse();
  const numWeeks = weeks.length;

  if (numWeeks === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 text-center">
        <p className="text-[13px] text-muted-foreground">No submission data available yet.</p>
      </div>
    );
  }

  const cellSize = 28;
  const cellGap = 4;
  const labelW = 50;
  const headerH = 24;
  const W = labelW + 7 * (cellSize + cellGap);
  const H = headerH + numWeeks * (cellSize + cellGap) + 8;

  function getCell(week: string, dayOfWeek: number): DayOfWeekCell | undefined {
    return data.find((d) => d.weekStart === week && d.dayOfWeek === dayOfWeek);
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">Day-of-Week Heatmap</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {numWeeks} weeks · Green = on-time, Yellow = late/missed, Red = multiple issues
        </p>
      </div>
      <div className="px-3 pb-4 relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 320 }} onMouseLeave={() => setHovered(null)}>
          {/* Column headers */}
          {DAY_LABELS.map((label, i) => (
            <text
              key={`header-${i}`}
              x={labelW + i * (cellSize + cellGap) + cellSize / 2}
              y={16}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="10"
              fontWeight="600"
            >
              {label}
            </text>
          ))}

          {/* Rows */}
          {weeks.map((week, rowIdx) => (
            <g key={week}>
              {/* Week label */}
              <text
                x={labelW - 8}
                y={headerH + rowIdx * (cellSize + cellGap) + cellSize / 2 + 3}
                textAnchor="end"
                className="fill-muted-foreground"
                fontSize="9"
              >
                {data.find((d) => d.weekStart === week)?.weekLabel || week}
              </text>

              {/* Day cells */}
              {DAY_INDEX.map((dow, colIdx) => {
                const cell = getCell(week, dow);
                const color = cell ? LEVEL_COLORS[cell.level] : LEVEL_COLORS.gray;
                const x = labelW + colIdx * (cellSize + cellGap);
                const y = headerH + rowIdx * (cellSize + cellGap);

                return (
                  <rect
                    key={`${week}-${dow}`}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={4}
                    fill={color}
                    opacity={cell && cell.level !== "gray" ? 0.85 : 0.4}
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      if (cell) {
                        setHovered(cell);
                        const svgRect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
                        const rect = (e.target as SVGElement).getBoundingClientRect();
                        setHoverPos({ x: rect.x - svgRect.x + cellSize / 2, y: rect.y - svgRect.y });
                      }
                    }}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hovered && hovered.level !== "gray" && (
          <div
            className="absolute bg-popover border rounded-lg shadow-lg px-3 py-2 pointer-events-none z-10"
            style={{
              left: hoverPos.x,
              top: hoverPos.y - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="text-[11px] font-medium text-foreground">
              {DAY_LABELS[DAY_INDEX.indexOf(hovered.dayOfWeek)]} · {hovered.weekLabel}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {hovered.onTimeCount} on-time · {hovered.lateCount} late · {hovered.missedCount} missed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

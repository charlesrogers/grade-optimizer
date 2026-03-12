"use client";

export function GradeImpactBar({
  delta,
  maxDelta,
}: {
  delta: number;
  maxDelta: number;
}) {
  const width = maxDelta > 0 ? Math.min(100, (delta / maxDelta) * 100) : 0;

  const color =
    delta >= 2
      ? "bg-emerald-500"
      : delta >= 1
        ? "bg-blue-500"
        : delta >= 0.5
          ? "bg-amber-500"
          : "bg-slate-300";

  const textColor =
    delta >= 2
      ? "text-emerald-600"
      : delta >= 1
        ? "text-blue-600"
        : delta >= 0.5
          ? "text-amber-600"
          : "text-muted-foreground";

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`text-[13px] font-medium tabular-nums ${textColor}`}>
        +{delta.toFixed(1)}%
      </span>
    </div>
  );
}

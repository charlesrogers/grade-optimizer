"use client";

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = "currentColor",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return null;

  // Single point — just a dot
  if (data.length === 1) {
    return (
      <svg width={width} height={height} className="inline-block align-middle">
        <circle cx={width / 2} cy={height / 2} r={2} fill={color} />
      </svg>
    );
  }

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * innerW;
    const y = padding + innerH - ((val - min) / range) * innerH;
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  // Gradient fill area
  const areaPath = [
    `M ${points[0].x},${padding + innerH}`,
    `L ${polyline.split(" ").map((p) => `L ${p}`).join(" ")}`,
    `L ${last.x},${padding + innerH}`,
    "Z",
  ].join(" ");

  const gradientId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2} fill={color} />
    </svg>
  );
}

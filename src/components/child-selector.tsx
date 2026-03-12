"use client";

import { Student } from "@/lib/types";

export function ChildSelector({
  observees,
  selectedId,
  onSelect,
}: {
  observees: Student[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (observees.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
        Viewing
      </span>
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
        {observees.map((child) => (
          <button
            key={child.id}
            onClick={() => onSelect(child.id)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              selectedId === child.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {child.name}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { generateEngagementDemoData } from "@/lib/demo-data";
import { analyzeEngagement } from "@/lib/engagement-engine";
import { EngagementDashboard } from "@/components/engagement-dashboard";

const demoStudents = generateEngagementDemoData();
const analyses = demoStudents.map((s) =>
  analyzeEngagement(s.courses, s.studentId, s.studentName)
);

export default function EngagementDemoPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const analysis = analyses[selectedIdx];

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <p className="text-[12px] font-medium text-amber-800">
            Demo mode — showing sample engagement data
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Student selector */}
        <div className="flex gap-2">
          {analyses.map((a, i) => (
            <button
              key={a.studentId}
              onClick={() => setSelectedIdx(i)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors flex items-center gap-2 ${
                selectedIdx === i
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {a.studentName}
              <span
                className={`h-2 w-2 rounded-full ${
                  a.level === "green"
                    ? "bg-emerald-500"
                    : a.level === "yellow"
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
              />
            </button>
          ))}
        </div>

        <EngagementDashboard analysis={analysis} />
      </div>
    </>
  );
}

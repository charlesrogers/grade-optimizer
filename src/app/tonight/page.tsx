"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionPlanner } from "@/components/session-planner";
import { ChildSelector } from "@/components/child-selector";
import { useStudentSelector } from "@/lib/use-student";
import { GradeOptimizerResponse } from "@/lib/types";

export default function TonightPage() {
  const router = useRouter();
  const [data, setData] = useState<GradeOptimizerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const student = useStudentSelector();

  useEffect(() => {
    async function fetchGrades() {
      setLoading(true);
      try {
        const res = await fetch(student.buildGradesUrl());
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to fetch grades");
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchGrades();
  }, [router, student.buildGradesUrl]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="h-7 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-16 bg-muted animate-pulse rounded-xl" />
          <div className="h-12 bg-muted animate-pulse rounded-xl" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <p className="text-[15px] font-medium mb-1">Something went wrong</p>
          <p className="text-[13px] text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const criticalCount = data.todos.filter((t) => t.priority === "critical").length;
  const topTodo = data.todos[0];
  const totalPossibleDelta = data.todos.reduce((s, t) => s + t.gradeDelta, 0);

  const headline = criticalCount > 0
    ? `${criticalCount} overdue item${criticalCount > 1 ? "s" : ""} — every day late costs more points`
    : data.todos.length > 0
      ? `${data.todos.length} assignments you can work on — up to +${totalPossibleDelta.toFixed(1)}% total grade boost`
      : "All caught up — nothing to optimize right now";

  const subtitle = topTodo
    ? `Set your available time and we'll pick the assignments with the biggest grade payoff. Start with "${topTodo.assignmentName}" — it has the highest impact.`
    : "Connect to your LMS to see personalized recommendations.";

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{headline}</h1>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {student.isParent && (
        <ChildSelector
          observees={student.observees}
          selectedId={student.selectedId}
          onSelect={student.setSelectedId}
        />
      )}

      <SessionPlanner todos={data.todos} currentGPA={data.overallGPA} />
    </div>
  );
}

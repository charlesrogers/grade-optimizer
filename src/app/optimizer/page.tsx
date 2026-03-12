"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TodoList } from "@/components/todo-list";
import { ChildSelector } from "@/components/child-selector";
import { Slider } from "@/components/ui/slider";
import { useStudentSelector } from "@/lib/use-student";
import { GradeOptimizerResponse } from "@/lib/types";

export default function OptimizerPage() {
  const router = useRouter();
  const [data, setData] = useState<GradeOptimizerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expectedScore, setExpectedScore] = useState(85);
  const [refreshKey, setRefreshKey] = useState(0);
  const student = useStudentSelector();

  useEffect(() => {
    async function fetchGrades() {
      setLoading(true);
      try {
        const res = await fetch(
          student.buildGradesUrl(`expectedScore=${expectedScore}`)
        );
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
  }, [router, refreshKey, student.buildGradesUrl, expectedScore]);

  const courseNames = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.todos.map((t) => t.courseName))].sort();
  }, [data]);

  function handleScoreChange(value: number | readonly number[]) {
    const v = Array.isArray(value) ? value[0] : value;
    setExpectedScore(v);
  }

  function handleRecalculate() {
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-12 bg-muted animate-pulse rounded-xl" />
          <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
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

  const criticalCount = data.todos.filter(
    (t) => t.priority === "critical"
  ).length;
  const highCount = data.todos.filter((t) => t.priority === "high").length;
  const gpaDiff = data.maxPotentialGPA - data.overallGPA;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Optimizer</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {data.summary}
        </p>
      </div>

      {/* Child selector for parent accounts */}
      {student.isParent && (
        <ChildSelector
          observees={student.observees}
          selectedId={student.selectedId}
          onSelect={student.setSelectedId}
        />
      )}

      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-2">
        {criticalCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[12px] font-medium ring-1 ring-inset ring-red-600/10">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {criticalCount} critical
          </span>
        )}
        {highCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[12px] font-medium ring-1 ring-inset ring-amber-600/10">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {highCount} high priority
          </span>
        )}
        {gpaDiff > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-medium ring-1 ring-inset ring-emerald-600/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            +{gpaDiff.toFixed(2)} GPA possible
          </span>
        )}
      </div>

      {/* Score assumption control */}
      <div className="rounded-xl border bg-card px-5 py-4 shadow-sm shadow-black/[0.04]">
        <div className="flex items-center gap-5">
          <span className="text-[13px] text-muted-foreground whitespace-nowrap">
            Assuming you&apos;ll score
          </span>
          <Slider
            value={[expectedScore]}
            onValueChange={handleScoreChange}
            min={50}
            max={100}
            step={5}
            className="flex-1 max-w-xs"
          />
          <span className="text-[15px] font-semibold tabular-nums w-12 text-right">
            {expectedScore}%
          </span>
          <button
            onClick={handleRecalculate}
            className="px-3 py-1.5 rounded-lg border text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Recalculate
          </button>
        </div>
      </div>

      {/* The list */}
      <TodoList todos={data.todos} courses={courseNames} />
    </div>
  );
}

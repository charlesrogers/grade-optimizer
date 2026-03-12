"use client";

import { useState, useEffect, useCallback } from "react";
import type { AcademicHistoryResponse, SubjectCategory } from "@/lib/types";
import { buildAcademicHistory } from "@/lib/history-engine";
import { getOverrides, setOverride } from "@/lib/subject-classifier";
import { SubjectStrengthCard } from "@/components/subject-strength-card";
import { SemesterGrid } from "@/components/semester-grid";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { isDemoMode } from "@/lib/demo-mode";

function GPAChart({ termGPAs }: { termGPAs: AcademicHistoryResponse["termGPAs"] }) {
  if (termGPAs.length < 2) {
    return (
      <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] p-6 text-center">
        <p className="text-[13px] text-muted-foreground">Need at least 2 terms to show GPA trends.</p>
      </div>
    );
  }

  const W = 600;
  const H = 180;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 32;
  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  const gpas = termGPAs.map((t) => t.gpa);
  const minGPA = Math.max(0, Math.min(...gpas) - 0.3);
  const maxGPA = Math.min(4.0, Math.max(...gpas) + 0.3);
  const range = maxGPA - minGPA || 1;

  function toX(i: number): number {
    return padLeft + (i / (termGPAs.length - 1)) * innerW;
  }
  function toY(gpa: number): number {
    return padTop + innerH - ((gpa - minGPA) / range) * innerH;
  }

  const polyline = termGPAs.map((t, i) => `${toX(i)},${toY(t.gpa)}`).join(" ");

  // Y ticks
  const yTicks: number[] = [];
  const step = 0.5;
  for (let v = Math.ceil(minGPA / step) * step; v <= maxGPA; v += step) {
    yTicks.push(Math.round(v * 10) / 10);
  }

  // Gradient area
  const last = termGPAs.length - 1;
  const areaPath = `M ${toX(0)},${padTop + innerH} ${termGPAs.map((t, i) => `L ${toX(i)},${toY(t.gpa)}`).join(" ")} L ${toX(last)},${padTop + innerH} Z`;

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">Term GPA Trajectory</h2>
      </div>
      <div className="px-3 pb-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
          <defs>
            <linearGradient id="gpa-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis grid */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={padLeft} y1={toY(v)} x2={W - padRight} y2={toY(v)} stroke="currentColor" strokeOpacity="0.08" />
              <text x={padLeft - 6} y={toY(v) + 3} textAnchor="end" className="fill-muted-foreground" fontSize="9">
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {termGPAs.map((t, i) => (
            <text key={t.termId} x={toX(i)} y={H - 4} textAnchor="middle" className="fill-muted-foreground" fontSize="8">
              {t.termName}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#gpa-grad)" />

          {/* Line */}
          <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots + labels */}
          {termGPAs.map((t, i) => (
            <g key={t.termId}>
              <circle cx={toX(i)} cy={toY(t.gpa)} r={4} fill="#3b82f6" stroke="white" strokeWidth="2" />
              <text x={toX(i)} y={toY(t.gpa) - 10} textAnchor="middle" className="fill-foreground" fontSize="10" fontWeight="600">
                {t.gpa.toFixed(2)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function HistoryContent({
  data,
  rawCourses,
}: {
  data: AcademicHistoryResponse;
  rawCourses?: { id: string; name: string; finalScore: number | null; currentScore: number | null; isActive: boolean; term: { id: string; name: string; startAt: string | null; endAt: string | null } | null }[] | null;
}) {
  const [history, setHistory] = useState(data);

  const handleOverride = useCallback(
    (courseName: string, category: SubjectCategory) => {
      setOverride(courseName, category);
      // Re-run engine with updated overrides if we have raw data
      if (rawCourses) {
        const updated = buildAcademicHistory(
          history.studentId,
          history.studentName,
          rawCourses,
          getOverrides()
        );
        setHistory(updated);
      }
    },
    [rawCourses, history.studentId, history.studentName]
  );

  const TrajectoryIcon =
    history.overallTrajectory === "improving" ? TrendingUp :
    history.overallTrajectory === "declining" ? TrendingDown : Minus;

  const trajectoryColor =
    history.overallTrajectory === "improving" ? "text-emerald-600" :
    history.overallTrajectory === "declining" ? "text-red-600" : "text-gray-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-foreground">{history.studentName}</h1>
          <p className="text-[13px] text-muted-foreground">
            Academic History · {history.terms.length} term{history.terms.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 ${trajectoryColor}`}>
          <TrajectoryIcon className="h-5 w-5" />
          <span className="text-[13px] font-semibold capitalize">{history.overallTrajectory}</span>
        </div>
      </div>

      {/* GPA Chart */}
      <GPAChart termGPAs={history.termGPAs} />

      {/* Subject Strength Cards */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">Subject Strengths</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {history.subjectSummaries.map((summary) => (
            <SubjectStrengthCard key={summary.category} summary={summary} />
          ))}
        </div>
      </div>

      {/* Semester Grid */}
      <SemesterGrid
        terms={history.terms}
        courses={history.courses}
        onOverride={handleOverride}
      />
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState<AcademicHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | undefined>();

  useEffect(() => {
    // Check for observees (parent mode)
    try {
      const stored = sessionStorage.getItem("observees");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStudents(parsed);
          setSelectedStudent(parsed[0].id);
        }
      }
    } catch {
      // not a parent
    }
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (selectedStudent) params.set("studentId", selectedStudent);
        if (isDemoMode()) params.set("demo", "true");
        const qs = params.toString();
        const res = await fetch(`/api/canvas/history${qs ? `?${qs}` : ""}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch history");
        }
        const data: AcademicHistoryResponse = await res.json();

        // Apply client-side overrides
        if (Object.keys(getOverrides()).length > 0) {
          // We don't have raw courses here, just use server data
          // Overrides will work on next fetch
        }

        // Set student name from observees if available
        if (selectedStudent && students.length > 0) {
          const student = students.find((s) => s.id === selectedStudent);
          if (student) data.studentName = student.name;
        }

        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch history");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [selectedStudent, students]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-muted-foreground">Loading academic history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-[13px] text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!history) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Student selector for parent mode */}
      {students.length > 1 && (
        <div className="flex gap-2 mb-6">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStudent(s.id)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                selectedStudent === s.id
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <HistoryContent data={history} />
    </div>
  );
}

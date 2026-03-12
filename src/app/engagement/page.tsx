"use client";

import { useState, useEffect } from "react";
import type { Course, Student } from "@/lib/types";
import { analyzeEngagement } from "@/lib/engagement-engine";
import { EngagementDashboard } from "@/components/engagement-dashboard";
import Link from "next/link";

interface GradesResponse {
  students: Student[];
  selectedStudent: Student;
  rawCourses?: Course[];
}

export default function EngagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [coursesByStudent, setCoursesByStudent] = useState<Map<string, Course[]>>(new Map());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/canvas/grades");
        if (!res.ok) {
          setError("not_connected");
          setLoading(false);
          return;
        }
        const data: GradesResponse = await res.json();

        if (data.rawCourses) {
          setStudents(data.students);
          const map = new Map<string, Course[]>();
          map.set(data.selectedStudent.id, data.rawCourses);
          setCoursesByStudent(map);
        } else {
          setError("no_courses");
        }
      } catch {
        setError("not_connected");
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[13px] text-muted-foreground mt-3">Loading engagement data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center space-y-4">
        <h1 className="text-[20px] font-bold text-foreground">Engagement Analysis</h1>
        <p className="text-[13px] text-muted-foreground">
          {error === "not_connected"
            ? "Connect your Canvas account to see engagement patterns."
            : "No course data available for analysis."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Connect Canvas
          </Link>
          <Link
            href="/engagement/demo"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Try Demo
          </Link>
        </div>
      </div>
    );
  }

  const student = students[selectedIdx];
  const courses = coursesByStudent.get(student?.id) || [];
  const analysis = student
    ? analyzeEngagement(courses, student.id, student.name)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {students.length > 1 && (
        <div className="flex gap-2">
          {students.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSelectedIdx(i)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                selectedIdx === i
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {analysis ? (
        <EngagementDashboard analysis={analysis} />
      ) : (
        <p className="text-[13px] text-muted-foreground">No data available.</p>
      )}
    </div>
  );
}

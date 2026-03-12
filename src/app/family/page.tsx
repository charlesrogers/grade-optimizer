"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Student, GradeOptimizerResponse } from "@/lib/types";
import { FamilyDashboard } from "@/components/family-dashboard";
import { isDemoMode } from "@/lib/demo-mode";

interface ChildData {
  student: Student;
  data: GradeOptimizerResponse;
}

export default function FamilyPage() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observees, setObservees] = useState<Student[]>([]);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  useEffect(() => {
    // Read observees from sessionStorage
    try {
      const stored = sessionStorage.getItem("observees");
      if (stored) {
        const parsed = JSON.parse(stored) as Student[];
        if (parsed.length > 0) {
          setObservees(parsed);
          return;
        }
      }
    } catch {
      // no observees
    }
    // Not a parent account — redirect to single-child dashboard
    router.push("/dashboard");
  }, [router]);

  useEffect(() => {
    if (observees.length === 0) return;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all children's grades in parallel
        const demo = isDemoMode();
        const results = await Promise.all(
          observees.map(async (student) => {
            const demoQ = demo ? "&demo=true" : "";
            const res = await fetch(
              `/api/canvas/grades?studentId=${student.id}${demoQ}`
            );
            if (!demo && res.status === 401) {
              router.push("/");
              throw new Error("Not authenticated");
            }
            if (!res.ok) {
              const body = await res.json();
              throw new Error(
                body.error || `Failed to fetch grades for ${student.name}`
              );
            }
            const data: GradeOptimizerResponse = await res.json();
            return { student, data };
          })
        );

        setChildren(results);
        setFetchedAt(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [observees, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-muted animate-pulse rounded-md" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="grid gap-4 grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
          {observees.map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <span className="text-destructive text-lg">!</span>
          </div>
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

  return <FamilyDashboard children={children} fetchedAt={fetchedAt ?? undefined} />;
}

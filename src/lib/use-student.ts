"use client";

import { useState, useEffect, useCallback } from "react";
import { Student } from "./types";
import { isDemoMode } from "./demo-mode";

/**
 * Hook to manage student selection for parent/observer accounts.
 * Reads observees from sessionStorage (set during connect flow).
 */
export function useStudentSelector() {
  const [observees, setObservees] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    setDemo(isDemoMode());
    try {
      const stored = sessionStorage.getItem("observees");
      if (stored) {
        const parsed = JSON.parse(stored) as Student[];
        if (parsed.length > 0) {
          setObservees(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch {
      // no observees
    }
  }, []);

  const isParent = observees.length > 0;
  const selected = observees.find((o) => o.id === selectedId) ?? null;

  const buildGradesUrl = useCallback(
    (extra?: string) => {
      const params = new URLSearchParams();
      if (selectedId) params.set("studentId", selectedId);
      if (demo) params.set("demo", "true");
      if (extra) {
        const extraParams = new URLSearchParams(extra);
        extraParams.forEach((v, k) => params.set(k, v));
      }
      const qs = params.toString();
      return `/api/canvas/grades${qs ? `?${qs}` : ""}`;
    },
    [selectedId, demo]
  );

  return {
    isParent,
    observees,
    selectedId,
    selected,
    setSelectedId,
    buildGradesUrl,
  };
}

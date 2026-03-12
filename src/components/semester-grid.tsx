"use client";

import { useState } from "react";
import type { Term, HistoricalCourse, SubjectCategory } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_CATEGORIES: SubjectCategory[] = [
  "Math", "English", "Science", "Social Studies",
  "Languages", "Arts", "CS/Tech", "Electives",
];

function StrengthPill({ value }: { value: number }) {
  const rounded = Math.round(value);
  if (rounded === 0) return null;

  const isPositive = rounded > 0;
  const color = isPositive
    ? "bg-emerald-100 text-emerald-800"
    : "bg-red-100 text-red-800";

  return (
    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>
      {isPositive ? "+" : ""}{rounded}
    </span>
  );
}

function CategoryPill({
  category,
  onOverride,
}: {
  category: SubjectCategory;
  onOverride: (newCategory: SubjectCategory) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Select
        defaultValue={category}
        onValueChange={(val) => {
          onOverride(val as SubjectCategory);
          setEditing(false);
        }}
        onOpenChange={(open) => {
          if (!open) setEditing(false);
        }}
      >
        <SelectTrigger size="sm" className="h-5 text-[9px] px-1.5 min-w-0 w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full hover:bg-muted/80 transition-colors cursor-pointer"
      title="Click to change category"
    >
      {category}
    </button>
  );
}

export function SemesterGrid({
  terms,
  courses,
  onOverride,
}: {
  terms: Term[];
  courses: HistoricalCourse[];
  onOverride: (courseName: string, category: SubjectCategory) => void;
}) {
  // Get categories that have courses
  const categoriesWithCourses = ALL_CATEGORIES.filter((cat) =>
    courses.some((c) => c.subjectCategory === cat)
  );

  // Find active term
  const activeTermId = courses.find((c) => c.isActive)?.termId;

  return (
    <div className="rounded-xl border bg-card shadow-sm shadow-black/[0.04] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-foreground">Semester Details</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Click a category pill to reclassify a course
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b">
              <th className="text-left font-medium text-muted-foreground px-4 py-2 sticky left-0 bg-card z-10 min-w-[100px]">
                Subject
              </th>
              {terms.map((term) => (
                <th
                  key={term.id}
                  className={`text-center font-medium px-4 py-2 min-w-[140px] ${
                    term.id === activeTermId
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground"
                  }`}
                >
                  {term.name}
                  {term.id === activeTermId && (
                    <span className="ml-1 text-[9px] font-semibold text-primary">(current)</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categoriesWithCourses.map((category) => (
              <tr key={category} className="border-b last:border-b-0">
                <td className="font-medium text-foreground px-4 py-3 sticky left-0 bg-card z-10">
                  {category}
                </td>
                {terms.map((term) => {
                  const cellCourses = courses.filter(
                    (c) => c.subjectCategory === category && c.termId === term.id
                  );
                  const isActiveTerm = term.id === activeTermId;

                  return (
                    <td
                      key={term.id}
                      className={`px-4 py-3 ${isActiveTerm ? "bg-primary/5" : ""}`}
                    >
                      {cellCourses.length === 0 ? (
                        <span className="text-muted-foreground/40">—</span>
                      ) : (
                        <div className="space-y-2">
                          {cellCourses.map((course) => (
                            <div key={course.id} className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-foreground truncate max-w-[100px]" title={course.name}>
                                  {course.name}
                                </span>
                                <CategoryPill
                                  category={course.subjectCategory}
                                  onOverride={(cat) => onOverride(course.name, cat)}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold tabular-nums">
                                  {course.finalGrade != null ? `${course.finalGrade.toFixed(1)}%` : "—"}
                                </span>
                                <span className="text-muted-foreground">{course.letterGrade}</span>
                                <StrengthPill value={course.strengthIndex} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

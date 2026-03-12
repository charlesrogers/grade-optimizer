export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getLMSConfig } from "@/lib/cookies";
import { fetchCoursesFromConfig } from "@/lib/data-source";
import { calculateGradeBreakdown } from "@/lib/grade-engine";
import {
  generateTodoList,
  calculateOverallGPA,
  calculateMaxPotentialGPA,
  generateSummary,
} from "@/lib/optimizer";
import { generateForecasts } from "@/lib/forecast";
import { generateWorkloadRadar } from "@/lib/workload";
import { GradeOptimizerResponse, AssignmentSnapshot } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const lmsConfig = await getLMSConfig();
    if (!lmsConfig) {
      return NextResponse.json(
        { error: "Not connected. Please connect your account first." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const observedUserId = searchParams.get("studentId") || undefined;

    console.log(`Fetching courses from ${lmsConfig.type}...`);
    const courses = await fetchCoursesFromConfig(lmsConfig, observedUserId);
    console.log(`Fetched ${courses.length} courses`);

    const breakdowns = courses.map((course) => calculateGradeBreakdown(course));

    const expectedScore = Number(searchParams.get("expectedScore")) || 85;
    const todos = generateTodoList(courses, expectedScore);

    const overallGPA = calculateOverallGPA(breakdowns);
    const maxPotentialGPA = calculateMaxPotentialGPA(courses, expectedScore);
    const totalMissing = breakdowns.reduce((sum, b) => sum + b.missingCount, 0);

    const summary = generateSummary(todos, overallGPA, maxPotentialGPA);
    const forecasts = generateForecasts(courses);
    const workload = generateWorkloadRadar(courses, expectedScore);

    // Build flat assignment summaries for snapshot diffing
    const assignmentSummaries: AssignmentSnapshot[] = [];
    for (const course of courses) {
      for (const group of course.assignmentGroups) {
        for (const a of group.assignments) {
          assignmentSummaries.push({
            assignmentId: a.id,
            assignmentName: a.name,
            courseId: course.id,
            courseName: course.name,
            score: a.score,
            missing: a.missing,
            submitted: a.submitted,
          });
        }
      }
    }

    const response: GradeOptimizerResponse = {
      students: [],
      selectedStudent: {
        id: "self",
        name: "You",
        source: lmsConfig.type,
      },
      courses: breakdowns,
      todos,
      overallGPA,
      totalMissing,
      maxPotentialGPA,
      summary,
      forecasts,
      workload,
      assignmentSummaries,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Grade fetch error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch grades",
      },
      { status: 500 }
    );
  }
}

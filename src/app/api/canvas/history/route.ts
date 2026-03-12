export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getLMSConfig } from "@/lib/cookies";
import { fetchHistoricalFromConfig } from "@/lib/data-source";
import { buildAcademicHistory } from "@/lib/history-engine";
import { getDemoHistoryForStudent } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const isDemo = searchParams.get("demo") === "true";
    if (isDemo) {
      const studentId = searchParams.get("studentId") || "demo-sam";
      return NextResponse.json(getDemoHistoryForStudent(studentId));
    }

    const lmsConfig = await getLMSConfig();
    if (!lmsConfig) {
      return NextResponse.json(
        { error: "Not connected. Please connect your account first." },
        { status: 401 }
      );
    }
    const observedUserId = searchParams.get("studentId") || undefined;

    console.log("Fetching historical courses...");
    const rawCourses = await fetchHistoricalFromConfig(lmsConfig, observedUserId);
    console.log(`Fetched ${rawCourses.length} historical courses`);

    const history = buildAcademicHistory(
      observedUserId || "self",
      "Student",
      rawCourses,
      {} // overrides applied client-side
    );

    return NextResponse.json(history);
  } catch (err) {
    console.error("History fetch error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to fetch history",
      },
      { status: 500 }
    );
  }
}

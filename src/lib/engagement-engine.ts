import type {
  Course,
  SubmissionTimingPoint,
  DayOfWeekCell,
  DayOfWeekPattern,
  EngagementSignal,
  PeriodComparison,
  EngagementAnalysis,
} from "./types";
import { linearSlope } from "./history-engine";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function formatWeekLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DueItem {
  assignmentId: string;
  assignmentName: string;
  courseName: string;
  courseId: string;
  dueAt: string;
  submittedAt: string | null;
  hoursBeforeDeadline: number | null;
  dayOfWeek: number;
  weekStart: string;
  score: number | null;
  scorePercent: number | null;
  missing: boolean;
  late: boolean;
}

function collectDueItems(courses: Course[]): DueItem[] {
  const items: DueItem[] = [];
  for (const course of courses) {
    for (const group of course.assignmentGroups) {
      for (const a of group.assignments) {
        if (!a.dueAt) continue;
        const dueDate = new Date(a.dueAt);
        const dayOfWeek = dueDate.getDay();
        const weekStart = getMonday(dueDate);

        let hoursBeforeDeadline: number | null = null;
        if (a.submittedAt) {
          hoursBeforeDeadline = (Date.parse(a.dueAt) - Date.parse(a.submittedAt)) / 3_600_000;
        }

        const scorePercent = (a.score !== null && a.pointsPossible > 0)
          ? (a.score / a.pointsPossible) * 100
          : null;

        items.push({
          assignmentId: a.id,
          assignmentName: a.name,
          courseName: course.name,
          courseId: course.id,
          dueAt: a.dueAt,
          submittedAt: a.submittedAt,
          hoursBeforeDeadline,
          dayOfWeek,
          weekStart,
          score: a.score,
          scorePercent,
          missing: a.missing,
          late: a.late,
        });
      }
    }
  }
  // Sort by due date ascending
  items.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
  return items;
}

function buildTimingPoints(items: DueItem[]): SubmissionTimingPoint[] {
  return items
    .filter((it) => it.submittedAt && it.hoursBeforeDeadline !== null)
    .map((it) => ({
      assignmentId: it.assignmentId,
      assignmentName: it.assignmentName,
      courseName: it.courseName,
      courseId: it.courseId,
      dueAt: it.dueAt,
      submittedAt: it.submittedAt!,
      hoursBeforeDeadline: it.hoursBeforeDeadline!,
      dayOfWeek: it.dayOfWeek,
      weekStart: it.weekStart,
      score: it.score,
      scorePercent: it.scorePercent,
    }));
}

function buildHeatmap(items: DueItem[]): DayOfWeekCell[] {
  // Get unique weeks, sorted, last 8
  const weekSet = new Set(items.map((it) => it.weekStart));
  const weeks = Array.from(weekSet).sort().slice(-8);

  const cells: DayOfWeekCell[] = [];
  for (const week of weeks) {
    for (let dow = 0; dow < 7; dow++) {
      const matching = items.filter((it) => it.weekStart === week && it.dayOfWeek === dow);
      if (matching.length === 0) {
        cells.push({
          dayOfWeek: dow,
          weekStart: week,
          weekLabel: formatWeekLabel(week),
          submissions: 0,
          onTimeCount: 0,
          lateCount: 0,
          missedCount: 0,
          level: "gray",
        });
        continue;
      }
      const onTime = matching.filter((it) => it.submittedAt && !it.late).length;
      const late = matching.filter((it) => it.late).length;
      const missed = matching.filter((it) => it.missing).length;

      let level: "green" | "yellow" | "red" | "gray" = "green";
      if (missed >= 2 || (late > matching.length / 2)) level = "red";
      else if (late > 0 || missed >= 1) level = "yellow";

      cells.push({
        dayOfWeek: dow,
        weekStart: week,
        weekLabel: formatWeekLabel(week),
        submissions: matching.length,
        onTimeCount: onTime,
        lateCount: late,
        missedCount: missed,
        level,
      });
    }
  }
  return cells;
}

function buildDayPatterns(items: DueItem[]): DayOfWeekPattern[] {
  const patterns: DayOfWeekPattern[] = [];
  for (let dow = 0; dow < 7; dow++) {
    const dayItems = items.filter((it) => it.dayOfWeek === dow);
    if (dayItems.length === 0) continue;

    const onTime = dayItems.filter((it) => it.submittedAt && !it.late).length;
    const late = dayItems.filter((it) => it.late).length;
    const missed = dayItems.filter((it) => it.missing).length;
    const withTiming = dayItems.filter((it) => it.hoursBeforeDeadline !== null);
    const avgHours = withTiming.length > 0
      ? withTiming.reduce((s, it) => s + it.hoursBeforeDeadline!, 0) / withTiming.length
      : 0;

    const isProblematic = missed >= 2 || avgHours < 0;

    patterns.push({
      dayOfWeek: dow,
      dayName: DAY_NAMES[dow],
      totalDue: dayItems.length,
      onTimeCount: onTime,
      lateCount: late,
      missedCount: missed,
      avgHoursBeforeDeadline: Math.round(avgHours * 10) / 10,
      isProblematic,
    });
  }
  return patterns;
}

function detectSignals(
  items: DueItem[],
  timingPoints: SubmissionTimingPoint[],
  dayPatterns: DayOfWeekPattern[],
  trendSlope: number
): EngagementSignal[] {
  const signals: EngagementSignal[] = [];
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 86_400_000;
  const fourWeeksAgo = now - 28 * 86_400_000;

  // Timing drift
  if (trendSlope < -4) {
    signals.push({
      type: "timing_drift",
      severity: "critical",
      title: "Submissions trending significantly later",
      detail: `Sliding ${Math.abs(Math.round(trendSlope * 10) / 10)} hours/week toward deadlines`,
      actionable: "Review upcoming due dates together and set submission targets for each",
    });
  } else if (trendSlope < -2) {
    signals.push({
      type: "timing_drift",
      severity: "warning",
      title: "Submissions are trending later",
      detail: `Sliding ${Math.abs(Math.round(trendSlope * 10) / 10)} hours/week toward deadlines`,
      actionable: "Check in about workload — this pattern often precedes missing work",
    });
  }

  // Missing spike
  const recentMissed = items.filter((it) => it.missing && Date.parse(it.dueAt) >= twoWeeksAgo).length;
  const priorMissed = items.filter((it) => it.missing && Date.parse(it.dueAt) >= fourWeeksAgo && Date.parse(it.dueAt) < twoWeeksAgo).length;
  const missingDelta = recentMissed - priorMissed;

  if (missingDelta >= 4) {
    signals.push({
      type: "missing_spike",
      severity: "critical",
      title: `${recentMissed} missing assignments in the last 2 weeks`,
      detail: `Up from ${priorMissed} the prior 2 weeks`,
      actionable: "Immediate conversation needed — ask what's going on and offer to help prioritize",
    });
  } else if (missingDelta >= 2) {
    signals.push({
      type: "missing_spike",
      severity: "warning",
      title: `${recentMissed} missing assignments in the last 2 weeks`,
      detail: `Up from ${priorMissed} the prior 2 weeks`,
      actionable: "Ask about the missing work — is it forgotten or intentionally skipped?",
    });
  }

  // Day patterns
  const problematicDays = dayPatterns.filter((d) => d.isProblematic);
  for (const day of problematicDays) {
    const weeksAffected = day.missedCount + day.lateCount;
    signals.push({
      type: "day_pattern",
      severity: weeksAffected >= 5 ? "warning" : "info",
      title: `${day.dayName}s are consistently problematic`,
      detail: `${day.missedCount} missed, ${day.lateCount} late out of ${day.totalDue} assignments due on ${day.dayName}s`,
      actionable: `Consider what happens on ${day.dayName}s — extracurriculars, schedule conflicts, or fatigue?`,
    });
  }

  // Quality drop
  const recentScores = items
    .filter((it) => it.scorePercent !== null && Date.parse(it.dueAt) >= twoWeeksAgo)
    .map((it) => it.scorePercent!);
  const priorScores = items
    .filter((it) => it.scorePercent !== null && Date.parse(it.dueAt) >= fourWeeksAgo && Date.parse(it.dueAt) < twoWeeksAgo)
    .map((it) => it.scorePercent!);

  if (recentScores.length >= 2 && priorScores.length >= 2) {
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const priorAvg = priorScores.reduce((a, b) => a + b, 0) / priorScores.length;
    const drop = priorAvg - recentAvg;

    if (drop >= 15) {
      signals.push({
        type: "quality_drop",
        severity: "critical",
        title: `Average scores dropped ${Math.round(drop)}%`,
        detail: `Recent: ${Math.round(recentAvg)}% vs prior: ${Math.round(priorAvg)}%`,
        actionable: "Scores are falling even on submitted work — check if they need help understanding material",
      });
    } else if (drop >= 10) {
      signals.push({
        type: "quality_drop",
        severity: "warning",
        title: `Average scores dropped ${Math.round(drop)}%`,
        detail: `Recent: ${Math.round(recentAvg)}% vs prior: ${Math.round(priorAvg)}%`,
        actionable: "Quality is slipping — ask if they're struggling with the material or rushing",
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  signals.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return signals;
}

function buildPeriodComparison(items: DueItem[], periodType: "week" | "month"): PeriodComparison {
  const now = new Date();

  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;
  let label: string;

  if (periodType === "week") {
    label = "Week over Week";
    const day = now.getDay();
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    currentStart.setHours(0, 0, 0, 0);
    currentEnd = new Date(currentStart);
    currentEnd.setDate(currentStart.getDate() + 7);
    previousStart = new Date(currentStart);
    previousStart.setDate(currentStart.getDate() - 7);
    previousEnd = new Date(currentStart);
  } else {
    label = "Month over Month";
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousEnd = new Date(currentStart);
  }

  function metricsFor(start: Date, end: Date) {
    const periodItems = items.filter((it) => {
      const d = Date.parse(it.dueAt);
      return d >= start.getTime() && d < end.getTime();
    });
    const withTiming = periodItems.filter((it) => it.hoursBeforeDeadline !== null);
    const avgHours = withTiming.length > 0
      ? withTiming.reduce((s, it) => s + it.hoursBeforeDeadline!, 0) / withTiming.length
      : 0;
    const scores = periodItems.filter((it) => it.scorePercent !== null).map((it) => it.scorePercent!);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    return {
      period: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      avgHoursBeforeDeadline: Math.round(avgHours * 10) / 10,
      missedCount: periodItems.filter((it) => it.missing).length,
      lateCount: periodItems.filter((it) => it.late).length,
      avgScorePercent: avgScore !== null ? Math.round(avgScore * 10) / 10 : null,
      totalDue: periodItems.length,
    };
  }

  const current = metricsFor(currentStart, currentEnd);
  const previous = metricsFor(previousStart, previousEnd);

  return {
    label,
    current,
    previous,
    timingDelta: Math.round((current.avgHoursBeforeDeadline - previous.avgHoursBeforeDeadline) * 10) / 10,
    missingDelta: current.missedCount - previous.missedCount,
    scoreDelta: (current.avgScorePercent !== null && previous.avgScorePercent !== null)
      ? Math.round((current.avgScorePercent - previous.avgScorePercent) * 10) / 10
      : null,
  };
}

function computeEngagementScore(
  timingPoints: SubmissionTimingPoint[],
  items: DueItem[],
  dayPatterns: DayOfWeekPattern[],
  trendSlope: number
): { score: number; level: "green" | "yellow" | "red" } {
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 86_400_000;

  // Timing (0-30): avg hours before deadline
  const avgHours = timingPoints.length > 0
    ? timingPoints.reduce((s, p) => s + p.hoursBeforeDeadline, 0) / timingPoints.length
    : 24;
  let timingScore: number;
  if (avgHours >= 48) timingScore = 30;
  else if (avgHours >= 24) timingScore = 22 + (avgHours - 24) / 24 * 8;
  else if (avgHours >= 12) timingScore = 15 + (avgHours - 12) / 12 * 7;
  else if (avgHours >= 0) timingScore = 5 + (avgHours / 12) * 10;
  else timingScore = Math.max(0, 5 + avgHours / 12);

  // Missing (0-25): 25 minus 5 per missed in last 2 weeks
  const recentMissed = items.filter((it) => it.missing && Date.parse(it.dueAt) >= twoWeeksAgo).length;
  const missingScore = Math.max(0, 25 - recentMissed * 5);

  // Consistency (0-25): penalty for problematic days and high variance
  const problematicCount = dayPatterns.filter((d) => d.isProblematic).length;
  const hoursValues = timingPoints.map((p) => p.hoursBeforeDeadline);
  let variance = 0;
  if (hoursValues.length >= 2) {
    const mean = hoursValues.reduce((a, b) => a + b, 0) / hoursValues.length;
    variance = hoursValues.reduce((s, v) => s + (v - mean) ** 2, 0) / hoursValues.length;
  }
  const variancePenalty = Math.min(10, Math.sqrt(variance) / 3);
  const consistencyScore = Math.max(0, 25 - problematicCount * 4 - variancePenalty);

  // Quality trend (0-20): based on score trend
  const recentScores = items
    .filter((it) => it.scorePercent !== null && Date.parse(it.dueAt) >= now - 28 * 86_400_000)
    .map((it) => it.scorePercent!);
  let qualityScore = 15; // default if not enough data
  if (recentScores.length >= 4) {
    const slope = linearSlope(recentScores);
    if (slope >= 0.5) qualityScore = 20;
    else if (slope >= -0.5) qualityScore = 15;
    else if (slope >= -2) qualityScore = 8;
    else qualityScore = 0;
  }

  const score = Math.round(Math.max(0, Math.min(100, timingScore + missingScore + consistencyScore + qualityScore)));
  const level = score >= 80 ? "green" : score >= 60 ? "yellow" : "red";

  return { score, level };
}

export function analyzeEngagement(
  courses: Course[],
  studentId: string,
  studentName: string
): EngagementAnalysis {
  const items = collectDueItems(courses);
  const timingPoints = buildTimingPoints(items);
  const heatmapData = buildHeatmap(items);
  const dayPatterns = buildDayPatterns(items);

  // Compute timing trend slope (hours/week)
  // Group timing points by week, compute avg hours per week, then slope
  const weekMap = new Map<string, number[]>();
  for (const pt of timingPoints) {
    if (!weekMap.has(pt.weekStart)) weekMap.set(pt.weekStart, []);
    weekMap.get(pt.weekStart)!.push(pt.hoursBeforeDeadline);
  }
  const weeklyAvgs = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, vals]) => vals.reduce((a, b) => a + b, 0) / vals.length);
  const timingTrendSlope = weeklyAvgs.length >= 2
    ? Math.round(linearSlope(weeklyAvgs) * 10) / 10
    : 0;

  const signals = detectSignals(items, timingPoints, dayPatterns, timingTrendSlope);
  const wow = buildPeriodComparison(items, "week");
  const mom = buildPeriodComparison(items, "month");
  const { score, level } = computeEngagementScore(timingPoints, items, dayPatterns, timingTrendSlope);

  return {
    studentId,
    studentName,
    engagementScore: score,
    level,
    timingPoints,
    heatmapData,
    dayPatterns,
    signals,
    wow,
    mom,
    timingTrendSlope,
  };
}

// === Configuration ===

export interface CanvasConfig {
  baseUrl: string; // e.g. "https://district.instructure.com"
  accessToken: string;
}

export interface SkywardConfig {
  loginUrl: string; // e.g. "https://skyward.district.net/scripts/wsisa.dll/WService=wsEAplus"
  username: string;
  password: string;
}

export type LMSConfig =
  | { type: "canvas"; config: CanvasConfig }
  | { type: "skyward"; config: SkywardConfig };

// === Core Data Models (normalized across Canvas & Skyward) ===

export interface Student {
  id: string;
  name: string;
  source: "canvas" | "skyward";
}

export interface Course {
  id: string;
  name: string;
  currentScore: number | null; // grade-to-date (ignoring ungraded)
  finalScore: number | null; // treating ungraded as zeros
  assignmentGroups: AssignmentGroup[];
  source: "canvas" | "skyward";
}

export interface AssignmentGroup {
  id: string;
  name: string; // "Homework", "Tests", "Projects"
  weight: number; // 0-100 percentage
  rules: DropRules;
  assignments: Assignment[];
}

export interface DropRules {
  dropLowest: number;
  dropHighest: number;
  neverDrop: string[]; // assignment IDs
}

export interface Assignment {
  id: string;
  name: string;
  dueAt: string | null; // ISO date
  pointsPossible: number;
  score: number | null; // null = ungraded/unsubmitted
  submitted: boolean;
  missing: boolean;
  late: boolean;
  excused: boolean;
  omitFromFinalGrade: boolean;
  assignmentGroupId: string;
  htmlUrl?: string; // link to assignment in LMS
  submittedAt: string | null;  // ISO timestamp of actual submission
  secondsLate: number;         // 0 if on-time, positive if late
}

// === Grade Calculation Results ===

export interface GradeBreakdown {
  courseId: string;
  courseName: string;
  currentGrade: number; // weighted grade-to-date
  projectedGrade: number; // with zeros for all missing
  letterGrade: string;
  projectedLetterGrade: string;
  categoryBreakdowns: CategoryBreakdown[];
  missingCount: number;
  potentialGain: number; // max grade improvement from completing all missing
}

export interface CategoryBreakdown {
  groupId: string;
  groupName: string;
  weight: number;
  earned: number;
  possible: number;
  categoryGrade: number; // earned/possible as percentage
  missingCount: number;
  droppedCount: number;
}

// === Optimizer Output ===

export interface TodoItem {
  assignmentId: string;
  assignmentName: string;
  courseName: string;
  courseId: string;
  categoryName: string;
  categoryWeight: number;
  dueAt: string | null;
  pointsPossible: number;
  gradeDelta: number; // percentage points gained if completed
  estimatedEffort: number; // minutes
  efficiency: number; // gradeDelta / (estimatedEffort / 60)
  priority: "critical" | "high" | "medium" | "low";
  status: "missing" | "upcoming" | "late";
  htmlUrl?: string;
  thresholdCrossing?: string; // e.g. "B+ → A-"
}

// === Grade Forecast ===

export interface CategoryTrend {
  groupId: string;
  groupName: string;
  weight: number;
  averageScore: number; // avg % on graded work in this category
  gradedCount: number;
  remainingCount: number;
  riskScore: number; // higher = more exposure in this category
}

export interface GradeTarget {
  letter: string;
  minGrade: number;
  requiredAverage: number; // avg % needed on remaining work
  feasible: boolean; // requiredAverage <= 100
}

export interface CourseForecast {
  courseId: string;
  courseName: string;
  projectedFinalGrade: number; // using per-category averages
  projectedLetterGrade: string;
  categoryTrends: CategoryTrend[];
  targets: GradeTarget[];
  riskCategory: CategoryTrend | null;
}

// === Workload Radar ===

export interface WorkloadAssignment {
  assignmentId: string;
  assignmentName: string;
  courseName: string;
  courseId: string;
  categoryName: string;
  categoryWeight: number;
  dueAt: string;
  pointsPossible: number;
  estimatedEffort: number; // minutes
  gradeImpact: number; // grade delta at expected %
  isHighImpact: boolean;
  htmlUrl?: string;
}

export interface WorkloadPeriod {
  label: string;
  assignments: WorkloadAssignment[];
  totalEffort: number;
  totalGradeImpact: number;
}

export interface WorkloadRadar {
  periods: WorkloadPeriod[];
  totalUpcoming: number;
  totalEffort: number;
  highImpactCount: number;
}

// === Session Planner ===

export interface SessionPlanItem extends TodoItem {
  cumulativeTime: number;
  cumulativeGradeDelta: number;
}

export interface SessionPlan {
  availableMinutes: number;
  items: SessionPlanItem[];
  totalEffort: number;
  totalGradeDelta: number;
  projectedGPA: number;
  unusedMinutes: number;
}

// === API Response ===

export interface GradeOptimizerResponse {
  students: Student[];
  selectedStudent: Student;
  courses: GradeBreakdown[];
  todos: TodoItem[];
  overallGPA: number;
  totalMissing: number;
  maxPotentialGPA: number;
  summary: string;
  forecasts: CourseForecast[];
  workload: WorkloadRadar;
  assignmentSummaries?: AssignmentSnapshot[];
}

// === Child Health Score ===

export interface ChildHealthScore {
  score: number; // 0-100 composite
  level: "green" | "yellow" | "red";
  gpaComponent: number; // 0-30
  missingWorkPenalty: number; // 0-25
  trendComponent: number; // 0-20
  cliffRiskComponent: number; // 0-15
  workloadCompliance: number; // 0-10
}

// === Grade Snapshots (localStorage) ===

export interface AssignmentSnapshot {
  assignmentId: string;
  assignmentName: string;
  courseId: string;
  courseName: string;
  score: number | null;
  missing: boolean;
  submitted: boolean;
}

export interface GradeSnapshot {
  timestamp: string; // ISO date
  studentId: string;
  overallGPA: number;
  totalMissing: number;
  courses: {
    courseId: string;
    courseName: string;
    currentGrade: number;
    letterGrade: string;
    missingCount: number;
  }[];
  assignments?: AssignmentSnapshot[]; // optional for backward compat with old snapshots
}

export interface AssignmentChange {
  assignmentId: string;
  assignmentName: string;
  courseId: string;
  courseName: string;
  changeType: "graded" | "score_changed" | "newly_missing" | "no_longer_missing";
  oldScore: number | null;
  newScore: number | null;
}

export interface GradeDelta {
  studentId: string;
  studentName: string;
  snapshotAge: string; // e.g. "2 days ago"
  gpaChange: number | null;
  missingChange: number | null;
  courseChanges: {
    courseId: string;
    courseName: string;
    gradeChange: number;
    oldGrade: number;
    newGrade: number;
    oldLetter: string;
    newLetter: string;
    missingChange: number;
    newMissing: string[]; // assignment names newly missing since last snapshot
  }[];
  assignmentChanges?: AssignmentChange[];
}

// === Predictive Alerts ===

export type AlertSeverity = "critical" | "warning" | "info";

export interface PredictiveAlert {
  id: string;
  severity: AlertSeverity;
  type: "cliff" | "upcoming_risk" | "category_decline" | "missing_streak";
  title: string;
  detail: string;
  courseName: string;
  courseId: string;
  actionable: string; // what to do about it
}

// === Conversation Scripts ===

export interface ConversationScript {
  childName: string;
  items: ConversationItem[];
}

export interface ConversationItem {
  assignmentName: string;
  courseName: string;
  status: string; // "5 days overdue" / "due in 3 days"
  whyItMatters: string; // "+2.3% grade impact, could push B to B+"
  suggestedApproach: string; // "~45 min of work"
  priority: "critical" | "high" | "medium" | "low";
}

// === Letter Grade Mapping ===

// === Subject Classification ===
export type SubjectCategory =
  | "Math" | "English" | "Science" | "Social Studies"
  | "Languages" | "Arts" | "CS/Tech" | "Electives";

// === Academic Terms ===
export interface Term {
  id: string;
  name: string;
  startAt: string | null;
  endAt: string | null;
}

// === Historical Course (lightweight — no assignment groups) ===
export interface HistoricalCourse {
  id: string;
  name: string;
  termId: string;
  termName: string;
  finalGrade: number | null;
  letterGrade: string;
  subjectCategory: SubjectCategory;
  isActive: boolean;
  strengthIndex: number;
}

// === Subject Summary (aggregated across terms) ===
export interface SubjectSummary {
  category: SubjectCategory;
  averageGrade: number;
  courseCount: number;
  trend: "improving" | "declining" | "stable";
  strengthLabel: "strong" | "average" | "weak";
  grades: { termId: string; termName: string; grade: number; courseName: string }[];
}

// === Full History Response ===
export interface AcademicHistoryResponse {
  studentId: string;
  studentName: string;
  terms: Term[];
  courses: HistoricalCourse[];
  subjectSummaries: SubjectSummary[];
  overallTrajectory: "improving" | "declining" | "stable";
  termGPAs: { termId: string; termName: string; gpa: number }[];
}

export const LETTER_GRADES: { min: number; letter: string; gpa: number }[] = [
  { min: 93, letter: "A", gpa: 4.0 },
  { min: 90, letter: "A-", gpa: 3.7 },
  { min: 87, letter: "B+", gpa: 3.3 },
  { min: 83, letter: "B", gpa: 3.0 },
  { min: 80, letter: "B-", gpa: 2.7 },
  { min: 77, letter: "C+", gpa: 2.3 },
  { min: 73, letter: "C", gpa: 2.0 },
  { min: 70, letter: "C-", gpa: 1.7 },
  { min: 67, letter: "D+", gpa: 1.3 },
  { min: 63, letter: "D", gpa: 1.0 },
  { min: 60, letter: "D-", gpa: 0.7 },
  { min: 0, letter: "F", gpa: 0.0 },
];

// === Engagement Detection ===

export interface SubmissionTimingPoint {
  assignmentId: string;
  assignmentName: string;
  courseName: string;
  courseId: string;
  dueAt: string;
  submittedAt: string;
  hoursBeforeDeadline: number;  // negative = late
  dayOfWeek: number;            // 0=Sun … 6=Sat
  weekStart: string;            // ISO date of the Monday of that week
  score: number | null;
  scorePercent: number | null;
}

export interface DayOfWeekCell {
  dayOfWeek: number;
  weekStart: string;
  weekLabel: string;            // "Mar 3"
  submissions: number;
  onTimeCount: number;
  lateCount: number;
  missedCount: number;
  level: "green" | "yellow" | "red" | "gray";
}

export interface DayOfWeekPattern {
  dayOfWeek: number;
  dayName: string;              // "Monday"
  totalDue: number;
  onTimeCount: number;
  lateCount: number;
  missedCount: number;
  avgHoursBeforeDeadline: number;
  isProblematic: boolean;
}

export interface EngagementSignal {
  type: "timing_drift" | "missing_spike" | "day_pattern" | "quality_drop";
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  actionable: string;
}

export interface PeriodComparison {
  label: string;
  current: { period: string; avgHoursBeforeDeadline: number; missedCount: number; lateCount: number; avgScorePercent: number | null; totalDue: number };
  previous: { period: string; avgHoursBeforeDeadline: number; missedCount: number; lateCount: number; avgScorePercent: number | null; totalDue: number };
  timingDelta: number;
  missingDelta: number;
  scoreDelta: number | null;
}

export interface EngagementAnalysis {
  studentId: string;
  studentName: string;
  engagementScore: number;      // 0–100
  level: "green" | "yellow" | "red";
  timingPoints: SubmissionTimingPoint[];
  heatmapData: DayOfWeekCell[];
  dayPatterns: DayOfWeekPattern[];
  signals: EngagementSignal[];
  wow: PeriodComparison;
  mom: PeriodComparison;
  timingTrendSlope: number;     // hours/week drift
}

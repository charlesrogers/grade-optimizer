import type {
  Student,
  GradeOptimizerResponse,
  GradeBreakdown,
  TodoItem,
  CourseForecast,
  CategoryTrend,
  GradeTarget,
  WorkloadRadar,
  WorkloadPeriod,
  AssignmentSnapshot,
  GradeSnapshot,
  AcademicHistoryResponse,
  Course,
  Assignment,
} from "./types";
import { buildAcademicHistory } from "./history-engine";

interface ChildData {
  student: Student;
  data: GradeOptimizerResponse;
}

// Helper to generate ISO dates relative to now
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function makeTargets(grade: number): GradeTarget[] {
  const thresholds = [
    { letter: "A", min: 93 },
    { letter: "A-", min: 90 },
    { letter: "B+", min: 87 },
    { letter: "B", min: 83 },
    { letter: "B-", min: 80 },
    { letter: "C+", min: 77 },
    { letter: "C", min: 73 },
  ];
  return thresholds.map((t) => ({
    letter: t.letter,
    minGrade: t.min,
    requiredAverage: t.min + (t.min - grade) * 0.5,
    feasible: t.min + (t.min - grade) * 0.5 <= 100,
  }));
}

function letterFor(grade: number): string {
  if (grade >= 93) return "A";
  if (grade >= 90) return "A-";
  if (grade >= 87) return "B+";
  if (grade >= 83) return "B";
  if (grade >= 80) return "B-";
  if (grade >= 77) return "C+";
  if (grade >= 73) return "C";
  if (grade >= 70) return "C-";
  if (grade >= 67) return "D+";
  if (grade >= 63) return "D";
  if (grade >= 60) return "D-";
  return "F";
}

function gpaFor(grade: number): number {
  if (grade >= 93) return 4.0;
  if (grade >= 90) return 3.7;
  if (grade >= 87) return 3.3;
  if (grade >= 83) return 3.0;
  if (grade >= 80) return 2.7;
  if (grade >= 77) return 2.3;
  if (grade >= 73) return 2.0;
  if (grade >= 70) return 1.7;
  if (grade >= 67) return 1.3;
  if (grade >= 63) return 1.0;
  if (grade >= 60) return 0.7;
  return 0.0;
}

// === SAM (Red, health ~45) ===
function buildSam(): ChildData {
  const courses: GradeBreakdown[] = [
    {
      courseId: "sam-aphist",
      courseName: "AP History",
      currentGrade: 81.2,
      projectedGrade: 74.5,
      letterGrade: "B-",
      projectedLetterGrade: "C",
      missingCount: 2,
      potentialGain: 6.7,
      categoryBreakdowns: [
        { groupId: "sh-hw", groupName: "Homework", weight: 20, earned: 170, possible: 200, categoryGrade: 85, missingCount: 0, droppedCount: 0 },
        { groupId: "sh-tests", groupName: "Tests", weight: 30, earned: 124, possible: 200, categoryGrade: 62, missingCount: 0, droppedCount: 0 },
        { groupId: "sh-essays", groupName: "Essays", weight: 25, earned: 88, possible: 100, categoryGrade: 88, missingCount: 1, droppedCount: 0 },
        { groupId: "sh-part", groupName: "Participation", weight: 15, earned: 90, possible: 100, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "sh-proj", groupName: "Projects", weight: 10, earned: 0, possible: 100, categoryGrade: 0, missingCount: 1, droppedCount: 0 },
      ],
    },
    {
      courseId: "sam-eng",
      courseName: "English",
      currentGrade: 74,
      projectedGrade: 70.2,
      letterGrade: "C",
      projectedLetterGrade: "C-",
      missingCount: 1,
      potentialGain: 3.8,
      categoryBreakdowns: [
        { groupId: "se-hw", groupName: "Homework", weight: 25, earned: 180, possible: 250, categoryGrade: 72, missingCount: 1, droppedCount: 0 },
        { groupId: "se-essays", groupName: "Essays", weight: 35, earned: 140, possible: 200, categoryGrade: 70, missingCount: 0, droppedCount: 0 },
        { groupId: "se-tests", groupName: "Tests", weight: 25, earned: 155, possible: 200, categoryGrade: 77.5, missingCount: 0, droppedCount: 0 },
        { groupId: "se-part", groupName: "Participation", weight: 15, earned: 85, possible: 100, categoryGrade: 85, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "sam-math",
      courseName: "Math",
      currentGrade: 88,
      projectedGrade: 88,
      letterGrade: "B+",
      projectedLetterGrade: "B+",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "sm-hw", groupName: "Homework", weight: 30, earned: 270, possible: 300, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "sm-tests", groupName: "Tests", weight: 40, earned: 172, possible: 200, categoryGrade: 86, missingCount: 0, droppedCount: 0 },
        { groupId: "sm-quiz", groupName: "Quizzes", weight: 30, earned: 175, possible: 200, categoryGrade: 87.5, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "sam-sci",
      courseName: "Science",
      currentGrade: 76,
      projectedGrade: 68.4,
      letterGrade: "C+",
      projectedLetterGrade: "D+",
      missingCount: 2,
      potentialGain: 7.6,
      categoryBreakdowns: [
        { groupId: "ss-hw", groupName: "Homework", weight: 20, earned: 160, possible: 200, categoryGrade: 80, missingCount: 0, droppedCount: 0 },
        { groupId: "ss-labs", groupName: "Labs", weight: 30, earned: 110, possible: 150, categoryGrade: 73.3, missingCount: 1, droppedCount: 0 },
        { groupId: "ss-tests", groupName: "Tests", weight: 35, earned: 140, possible: 200, categoryGrade: 70, missingCount: 0, droppedCount: 0 },
        { groupId: "ss-proj", groupName: "Projects", weight: 15, earned: 0, possible: 100, categoryGrade: 0, missingCount: 1, droppedCount: 0 },
      ],
    },
    {
      courseId: "sam-span",
      courseName: "Spanish",
      currentGrade: 91,
      projectedGrade: 91,
      letterGrade: "A-",
      projectedLetterGrade: "A-",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "ssp-hw", groupName: "Homework", weight: 25, earned: 230, possible: 250, categoryGrade: 92, missingCount: 0, droppedCount: 0 },
        { groupId: "ssp-tests", groupName: "Tests", weight: 35, earned: 180, possible: 200, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "ssp-oral", groupName: "Oral", weight: 25, earned: 92, possible: 100, categoryGrade: 92, missingCount: 0, droppedCount: 0 },
        { groupId: "ssp-part", groupName: "Participation", weight: 15, earned: 90, possible: 100, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
      ],
    },
  ];

  const todos: TodoItem[] = [
    {
      assignmentId: "sam-t1",
      assignmentName: "AP History Essay",
      courseName: "AP History",
      courseId: "sam-aphist",
      categoryName: "Essays",
      categoryWeight: 25,
      dueAt: daysFromNow(-5),
      pointsPossible: 100,
      gradeDelta: 2.3,
      estimatedEffort: 45,
      efficiency: 3.07,
      priority: "critical",
      status: "missing",
      thresholdCrossing: "B- \u2192 B",
    },
    {
      assignmentId: "sam-t2",
      assignmentName: "Science Lab Report",
      courseName: "Science",
      courseId: "sam-sci",
      categoryName: "Labs",
      categoryWeight: 30,
      dueAt: daysFromNow(-3),
      pointsPossible: 100,
      gradeDelta: 1.8,
      estimatedEffort: 40,
      efficiency: 2.7,
      priority: "critical",
      status: "missing",
      thresholdCrossing: "C+ \u2192 B-",
    },
    {
      assignmentId: "sam-t3",
      assignmentName: "English Reading Response",
      courseName: "English",
      courseId: "sam-eng",
      categoryName: "Homework",
      categoryWeight: 25,
      dueAt: daysFromNow(-1),
      pointsPossible: 50,
      gradeDelta: 1.1,
      estimatedEffort: 30,
      efficiency: 2.2,
      priority: "high",
      status: "missing",
    },
    {
      assignmentId: "sam-t4",
      assignmentName: "AP History DBQ Project",
      courseName: "AP History",
      courseId: "sam-aphist",
      categoryName: "Projects",
      categoryWeight: 10,
      dueAt: daysFromNow(-2),
      pointsPossible: 100,
      gradeDelta: 0.9,
      estimatedEffort: 60,
      efficiency: 0.9,
      priority: "high",
      status: "missing",
    },
    {
      assignmentId: "sam-t5",
      assignmentName: "Science Ecosystem Project",
      courseName: "Science",
      courseId: "sam-sci",
      categoryName: "Projects",
      categoryWeight: 15,
      dueAt: daysFromNow(-1),
      pointsPossible: 100,
      gradeDelta: 0.7,
      estimatedEffort: 50,
      efficiency: 0.84,
      priority: "high",
      status: "missing",
    },
  ];

  const forecasts: CourseForecast[] = [
    {
      courseId: "sam-aphist",
      courseName: "AP History",
      projectedFinalGrade: 79.5,
      projectedLetterGrade: "C+",
      categoryTrends: [
        { groupId: "sh-tests", groupName: "Tests", weight: 30, averageScore: 62, gradedCount: 2, remainingCount: 2, riskScore: 85 },
        { groupId: "sh-essays", groupName: "Essays", weight: 25, averageScore: 88, gradedCount: 1, remainingCount: 2, riskScore: 30 },
        { groupId: "sh-hw", groupName: "Homework", weight: 20, averageScore: 85, gradedCount: 10, remainingCount: 5, riskScore: 10 },
      ],
      targets: makeTargets(81.2),
      riskCategory: { groupId: "sh-tests", groupName: "Tests", weight: 30, averageScore: 62, gradedCount: 2, remainingCount: 2, riskScore: 85 },
    },
    {
      courseId: "sam-eng",
      courseName: "English",
      projectedFinalGrade: 73.5,
      projectedLetterGrade: "C",
      categoryTrends: [
        { groupId: "se-essays", groupName: "Essays", weight: 35, averageScore: 70, gradedCount: 4, remainingCount: 2, riskScore: 60 },
        { groupId: "se-hw", groupName: "Homework", weight: 25, averageScore: 72, gradedCount: 10, remainingCount: 5, riskScore: 25 },
      ],
      targets: makeTargets(74),
      riskCategory: { groupId: "se-essays", groupName: "Essays", weight: 35, averageScore: 70, gradedCount: 4, remainingCount: 2, riskScore: 60 },
    },
    {
      courseId: "sam-math",
      courseName: "Math",
      projectedFinalGrade: 87.8,
      projectedLetterGrade: "B+",
      categoryTrends: [
        { groupId: "sm-tests", groupName: "Tests", weight: 40, averageScore: 86, gradedCount: 3, remainingCount: 1, riskScore: 15 },
      ],
      targets: makeTargets(88),
      riskCategory: null,
    },
    {
      courseId: "sam-sci",
      courseName: "Science",
      projectedFinalGrade: 72.1,
      projectedLetterGrade: "C-",
      categoryTrends: [
        { groupId: "ss-tests", groupName: "Tests", weight: 35, averageScore: 70, gradedCount: 3, remainingCount: 2, riskScore: 70 },
        { groupId: "ss-labs", groupName: "Labs", weight: 30, averageScore: 73.3, gradedCount: 3, remainingCount: 2, riskScore: 50 },
      ],
      targets: makeTargets(76),
      riskCategory: { groupId: "ss-tests", groupName: "Tests", weight: 35, averageScore: 70, gradedCount: 3, remainingCount: 2, riskScore: 70 },
    },
    {
      courseId: "sam-span",
      courseName: "Spanish",
      projectedFinalGrade: 91.2,
      projectedLetterGrade: "A-",
      categoryTrends: [
        { groupId: "ssp-tests", groupName: "Tests", weight: 35, averageScore: 90, gradedCount: 3, remainingCount: 1, riskScore: 10 },
      ],
      targets: makeTargets(91),
      riskCategory: null,
    },
  ];

  const workload: WorkloadRadar = {
    periods: [
      {
        label: "This Week",
        assignments: [
          { assignmentId: "sam-w1", assignmentName: "Math Problem Set 12", courseName: "Math", courseId: "sam-math", categoryName: "Homework", categoryWeight: 30, dueAt: daysFromNow(2), pointsPossible: 50, estimatedEffort: 30, gradeImpact: 0.4, isHighImpact: false },
          { assignmentId: "sam-w2", assignmentName: "Spanish Vocab Quiz", courseName: "Spanish", courseId: "sam-span", categoryName: "Tests", categoryWeight: 35, dueAt: daysFromNow(3), pointsPossible: 25, estimatedEffort: 20, gradeImpact: 0.3, isHighImpact: false },
        ],
        totalEffort: 50,
        totalGradeImpact: 0.7,
      },
      {
        label: "Next Week",
        assignments: [
          { assignmentId: "sam-w3", assignmentName: "AP History Test 3", courseName: "AP History", courseId: "sam-aphist", categoryName: "Tests", categoryWeight: 30, dueAt: daysFromNow(9), pointsPossible: 100, estimatedEffort: 90, gradeImpact: 3.2, isHighImpact: true },
        ],
        totalEffort: 90,
        totalGradeImpact: 3.2,
      },
    ],
    totalUpcoming: 3,
    totalEffort: 140,
    highImpactCount: 1,
  };

  const samGrades = [81.2, 74, 88, 76, 91];
  const samGPA = Math.round((samGrades.reduce((s, g) => s + gpaFor(g), 0) / samGrades.length) * 100) / 100;

  const assignmentSummaries: AssignmentSnapshot[] = [
    { assignmentId: "sam-a1", assignmentName: "AP History Essay", courseId: "sam-aphist", courseName: "AP History", score: null, missing: true, submitted: false },
    { assignmentId: "sam-a2", assignmentName: "AP History DBQ Project", courseId: "sam-aphist", courseName: "AP History", score: null, missing: true, submitted: false },
    { assignmentId: "sam-a3", assignmentName: "AP History Test 2", courseId: "sam-aphist", courseName: "AP History", score: 64, missing: false, submitted: true },
    { assignmentId: "sam-a4", assignmentName: "English Reading Response", courseId: "sam-eng", courseName: "English", score: null, missing: true, submitted: false },
    { assignmentId: "sam-a5", assignmentName: "English Essay 4", courseId: "sam-eng", courseName: "English", score: 72, missing: false, submitted: true },
    { assignmentId: "sam-a6", assignmentName: "Math Quiz 7", courseId: "sam-math", courseName: "Math", score: 92, missing: false, submitted: true },
    { assignmentId: "sam-a7", assignmentName: "Science Lab Report", courseId: "sam-sci", courseName: "Science", score: null, missing: true, submitted: false },
    { assignmentId: "sam-a8", assignmentName: "Science Ecosystem Project", courseId: "sam-sci", courseName: "Science", score: null, missing: true, submitted: false },
    { assignmentId: "sam-a9", assignmentName: "Spanish Vocab Quiz", courseId: "sam-span", courseName: "Spanish", score: 88, missing: false, submitted: true },
  ];

  return {
    student: { id: "demo-sam", name: "Sam", source: "canvas" },
    data: {
      students: [{ id: "demo-sam", name: "Sam", source: "canvas" }],
      selectedStudent: { id: "demo-sam", name: "Sam", source: "canvas" },
      courses,
      todos,
      overallGPA: samGPA,
      totalMissing: 5,
      maxPotentialGPA: samGPA + 0.48,
      summary: "5 missing assignments across 3 courses. AP History Tests category averaging 62%. Immediate focus: AP History Essay and Science Lab Report.",
      forecasts,
      workload,
      assignmentSummaries,
    },
  };
}

// === ALEX (Yellow, health ~68) ===
function buildAlex(): ChildData {
  const courses: GradeBreakdown[] = [
    {
      courseId: "alex-chem",
      courseName: "Chemistry",
      currentGrade: 87.4,
      projectedGrade: 84.1,
      letterGrade: "B+",
      projectedLetterGrade: "B",
      missingCount: 1,
      potentialGain: 3.3,
      categoryBreakdowns: [
        { groupId: "ac-hw", groupName: "Homework", weight: 20, earned: 185, possible: 200, categoryGrade: 92.5, missingCount: 0, droppedCount: 0 },
        { groupId: "ac-labs", groupName: "Labs", weight: 25, earned: 210, possible: 250, categoryGrade: 84, missingCount: 1, droppedCount: 0 },
        { groupId: "ac-tests", groupName: "Tests", weight: 25, earned: 170, possible: 200, categoryGrade: 85, missingCount: 0, droppedCount: 0 },
        { groupId: "ac-quiz", groupName: "Quizzes", weight: 15, earned: 140, possible: 150, categoryGrade: 93.3, missingCount: 0, droppedCount: 0 },
        { groupId: "ac-proj", groupName: "Projects", weight: 15, earned: 85, possible: 100, categoryGrade: 85, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "alex-bio",
      courseName: "Biology",
      currentGrade: 92,
      projectedGrade: 92,
      letterGrade: "A-",
      projectedLetterGrade: "A-",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "ab-hw", groupName: "Homework", weight: 25, earned: 230, possible: 250, categoryGrade: 92, missingCount: 0, droppedCount: 0 },
        { groupId: "ab-tests", groupName: "Tests", weight: 35, earned: 185, possible: 200, categoryGrade: 92.5, missingCount: 0, droppedCount: 0 },
        { groupId: "ab-labs", groupName: "Labs", weight: 25, earned: 225, possible: 250, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "ab-part", groupName: "Participation", weight: 15, earned: 95, possible: 100, categoryGrade: 95, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "alex-alg",
      courseName: "Algebra 2",
      currentGrade: 83,
      projectedGrade: 83,
      letterGrade: "B",
      projectedLetterGrade: "B",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "aa-hw", groupName: "Homework", weight: 25, earned: 200, possible: 250, categoryGrade: 80, missingCount: 0, droppedCount: 0 },
        { groupId: "aa-tests", groupName: "Tests", weight: 40, earned: 168, possible: 200, categoryGrade: 84, missingCount: 0, droppedCount: 0 },
        { groupId: "aa-quiz", groupName: "Quizzes", weight: 35, earned: 170, possible: 200, categoryGrade: 85, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "alex-whist",
      courseName: "World History",
      currentGrade: 89,
      projectedGrade: 86.5,
      letterGrade: "B+",
      projectedLetterGrade: "B+",
      missingCount: 1,
      potentialGain: 2.5,
      categoryBreakdowns: [
        { groupId: "aw-hw", groupName: "Homework", weight: 20, earned: 175, possible: 200, categoryGrade: 87.5, missingCount: 0, droppedCount: 0 },
        { groupId: "aw-essays", groupName: "Essays", weight: 30, earned: 180, possible: 200, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "aw-tests", groupName: "Tests", weight: 30, earned: 178, possible: 200, categoryGrade: 89, missingCount: 0, droppedCount: 0 },
        { groupId: "aw-proj", groupName: "Projects", weight: 20, earned: 85, possible: 100, categoryGrade: 85, missingCount: 1, droppedCount: 0 },
      ],
    },
    {
      courseId: "alex-art",
      courseName: "Art",
      currentGrade: 95,
      projectedGrade: 95,
      letterGrade: "A",
      projectedLetterGrade: "A",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "aart-proj", groupName: "Projects", weight: 50, earned: 475, possible: 500, categoryGrade: 95, missingCount: 0, droppedCount: 0 },
        { groupId: "aart-part", groupName: "Participation", weight: 30, earned: 95, possible: 100, categoryGrade: 95, missingCount: 0, droppedCount: 0 },
        { groupId: "aart-sketch", groupName: "Sketchbook", weight: 20, earned: 95, possible: 100, categoryGrade: 95, missingCount: 0, droppedCount: 0 },
      ],
    },
  ];

  const todos: TodoItem[] = [
    {
      assignmentId: "alex-t1",
      assignmentName: "Chemistry Worksheet",
      courseName: "Chemistry",
      courseId: "alex-chem",
      categoryName: "Labs",
      categoryWeight: 25,
      dueAt: daysFromNow(-1),
      pointsPossible: 50,
      gradeDelta: 1.5,
      estimatedEffort: 25,
      efficiency: 3.6,
      priority: "high",
      status: "missing",
      thresholdCrossing: "B+ \u2192 A-",
    },
    {
      assignmentId: "alex-t2",
      assignmentName: "History DBQ",
      courseName: "World History",
      courseId: "alex-whist",
      categoryName: "Projects",
      categoryWeight: 20,
      dueAt: daysFromNow(3),
      pointsPossible: 100,
      gradeDelta: 0.8,
      estimatedEffort: 45,
      efficiency: 1.07,
      priority: "medium",
      status: "upcoming",
    },
  ];

  const forecasts: CourseForecast[] = [
    {
      courseId: "alex-chem",
      courseName: "Chemistry",
      projectedFinalGrade: 87.1,
      projectedLetterGrade: "B+",
      categoryTrends: [
        { groupId: "ac-tests", groupName: "Tests", weight: 25, averageScore: 85, gradedCount: 1, remainingCount: 2, riskScore: 65 },
        { groupId: "ac-labs", groupName: "Labs", weight: 25, averageScore: 84, gradedCount: 5, remainingCount: 3, riskScore: 30 },
      ],
      targets: makeTargets(87.4),
      riskCategory: { groupId: "ac-tests", groupName: "Tests", weight: 25, averageScore: 85, gradedCount: 1, remainingCount: 2, riskScore: 65 },
    },
    {
      courseId: "alex-bio",
      courseName: "Biology",
      projectedFinalGrade: 92.3,
      projectedLetterGrade: "A-",
      categoryTrends: [
        { groupId: "ab-tests", groupName: "Tests", weight: 35, averageScore: 92.5, gradedCount: 3, remainingCount: 1, riskScore: 10 },
      ],
      targets: makeTargets(92),
      riskCategory: null,
    },
    {
      courseId: "alex-alg",
      courseName: "Algebra 2",
      projectedFinalGrade: 83.2,
      projectedLetterGrade: "B",
      categoryTrends: [
        { groupId: "aa-tests", groupName: "Tests", weight: 40, averageScore: 84, gradedCount: 3, remainingCount: 2, riskScore: 35 },
      ],
      targets: makeTargets(83),
      riskCategory: null,
    },
    {
      courseId: "alex-whist",
      courseName: "World History",
      projectedFinalGrade: 88.5,
      projectedLetterGrade: "B+",
      categoryTrends: [
        { groupId: "aw-tests", groupName: "Tests", weight: 30, averageScore: 89, gradedCount: 3, remainingCount: 1, riskScore: 15 },
      ],
      targets: makeTargets(89),
      riskCategory: null,
    },
    {
      courseId: "alex-art",
      courseName: "Art",
      projectedFinalGrade: 95.1,
      projectedLetterGrade: "A",
      categoryTrends: [
        { groupId: "aart-proj", groupName: "Projects", weight: 50, averageScore: 95, gradedCount: 5, remainingCount: 2, riskScore: 5 },
      ],
      targets: makeTargets(95),
      riskCategory: null,
    },
  ];

  const workload: WorkloadRadar = {
    periods: [
      {
        label: "This Week",
        assignments: [
          { assignmentId: "alex-w1", assignmentName: "Bio Lab Write-up", courseName: "Biology", courseId: "alex-bio", categoryName: "Labs", categoryWeight: 25, dueAt: daysFromNow(2), pointsPossible: 50, estimatedEffort: 35, gradeImpact: 0.5, isHighImpact: false },
          { assignmentId: "alex-w2", assignmentName: "Algebra 2 Problem Set", courseName: "Algebra 2", courseId: "alex-alg", categoryName: "Homework", categoryWeight: 25, dueAt: daysFromNow(4), pointsPossible: 30, estimatedEffort: 25, gradeImpact: 0.3, isHighImpact: false },
        ],
        totalEffort: 60,
        totalGradeImpact: 0.8,
      },
      {
        label: "Next Week",
        assignments: [
          { assignmentId: "alex-w3", assignmentName: "Chemistry Test 2", courseName: "Chemistry", courseId: "alex-chem", categoryName: "Tests", categoryWeight: 25, dueAt: daysFromNow(8), pointsPossible: 100, estimatedEffort: 90, gradeImpact: 2.8, isHighImpact: true },
        ],
        totalEffort: 90,
        totalGradeImpact: 2.8,
      },
    ],
    totalUpcoming: 3,
    totalEffort: 150,
    highImpactCount: 1,
  };

  const alexGrades = [87.4, 92, 83, 89, 95];
  const alexGPA = Math.round((alexGrades.reduce((s, g) => s + gpaFor(g), 0) / alexGrades.length) * 100) / 100;

  const assignmentSummaries: AssignmentSnapshot[] = [
    { assignmentId: "alex-a1", assignmentName: "Chemistry Worksheet", courseId: "alex-chem", courseName: "Chemistry", score: null, missing: true, submitted: false },
    { assignmentId: "alex-a2", assignmentName: "Chemistry Lab 5", courseId: "alex-chem", courseName: "Chemistry", score: 88, missing: false, submitted: true },
    { assignmentId: "alex-a3", assignmentName: "Bio Lab Write-up", courseId: "alex-bio", courseName: "Biology", score: 94, missing: false, submitted: true },
    { assignmentId: "alex-a4", assignmentName: "Algebra 2 Test 3", courseId: "alex-alg", courseName: "Algebra 2", score: 81, missing: false, submitted: true },
    { assignmentId: "alex-a5", assignmentName: "History DBQ", courseId: "alex-whist", courseName: "World History", score: null, missing: true, submitted: false },
    { assignmentId: "alex-a6", assignmentName: "Art Portfolio Review", courseId: "alex-art", courseName: "Art", score: 96, missing: false, submitted: true },
  ];

  return {
    student: { id: "demo-alex", name: "Alex", source: "canvas" },
    data: {
      students: [{ id: "demo-alex", name: "Alex", source: "canvas" }],
      selectedStudent: { id: "demo-alex", name: "Alex", source: "canvas" },
      courses,
      todos,
      overallGPA: alexGPA,
      totalMissing: 2,
      maxPotentialGPA: alexGPA + 0.18,
      summary: "Chemistry within 0.4% of B+ boundary. Upcoming Chemistry test in 8 days. 2 missing assignments.",
      forecasts,
      workload,
      assignmentSummaries,
    },
  };
}

// === JORDAN (Green, health ~88) ===
function buildJordan(): ChildData {
  const courses: GradeBreakdown[] = [
    {
      courseId: "jor-precalc",
      courseName: "Pre-Calc",
      currentGrade: 94,
      projectedGrade: 94,
      letterGrade: "A",
      projectedLetterGrade: "A",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "jp-hw", groupName: "Homework", weight: 25, earned: 240, possible: 250, categoryGrade: 96, missingCount: 0, droppedCount: 0 },
        { groupId: "jp-tests", groupName: "Tests", weight: 40, earned: 185, possible: 200, categoryGrade: 92.5, missingCount: 0, droppedCount: 0 },
        { groupId: "jp-quiz", groupName: "Quizzes", weight: 35, earned: 185, possible: 200, categoryGrade: 92.5, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "jor-phys",
      courseName: "Physics",
      currentGrade: 91,
      projectedGrade: 91,
      letterGrade: "A-",
      projectedLetterGrade: "A-",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "jph-hw", groupName: "Homework", weight: 20, earned: 185, possible: 200, categoryGrade: 92.5, missingCount: 0, droppedCount: 0 },
        { groupId: "jph-labs", groupName: "Labs", weight: 25, earned: 225, possible: 250, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "jph-tests", groupName: "Tests", weight: 35, earned: 180, possible: 200, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "jph-part", groupName: "Participation", weight: 20, earned: 93, possible: 100, categoryGrade: 93, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "jor-eng",
      courseName: "English",
      currentGrade: 88,
      projectedGrade: 88,
      letterGrade: "B+",
      projectedLetterGrade: "B+",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "je-hw", groupName: "Homework", weight: 20, earned: 180, possible: 200, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "je-essays", groupName: "Essays", weight: 35, earned: 170, possible: 200, categoryGrade: 85, missingCount: 0, droppedCount: 0 },
        { groupId: "je-tests", groupName: "Tests", weight: 30, earned: 180, possible: 200, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
        { groupId: "je-part", groupName: "Participation", weight: 15, earned: 90, possible: 100, categoryGrade: 90, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "jor-ush",
      courseName: "US History",
      currentGrade: 93,
      projectedGrade: 93,
      letterGrade: "A",
      projectedLetterGrade: "A",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "jh-hw", groupName: "Homework", weight: 20, earned: 190, possible: 200, categoryGrade: 95, missingCount: 0, droppedCount: 0 },
        { groupId: "jh-essays", groupName: "Essays", weight: 25, earned: 185, possible: 200, categoryGrade: 92.5, missingCount: 0, droppedCount: 0 },
        { groupId: "jh-tests", groupName: "Tests", weight: 35, earned: 185, possible: 200, categoryGrade: 92.5, missingCount: 0, droppedCount: 0 },
        { groupId: "jh-part", groupName: "Participation", weight: 20, earned: 92, possible: 100, categoryGrade: 92, missingCount: 0, droppedCount: 0 },
      ],
    },
    {
      courseId: "jor-cs",
      courseName: "CS",
      currentGrade: 96,
      projectedGrade: 96,
      letterGrade: "A",
      projectedLetterGrade: "A",
      missingCount: 0,
      potentialGain: 0,
      categoryBreakdowns: [
        { groupId: "jc-hw", groupName: "Homework", weight: 20, earned: 195, possible: 200, categoryGrade: 97.5, missingCount: 0, droppedCount: 0 },
        { groupId: "jc-proj", groupName: "Projects", weight: 40, earned: 385, possible: 400, categoryGrade: 96.25, missingCount: 0, droppedCount: 0 },
        { groupId: "jc-tests", groupName: "Tests", weight: 25, earned: 190, possible: 200, categoryGrade: 95, missingCount: 0, droppedCount: 0 },
        { groupId: "jc-part", groupName: "Participation", weight: 15, earned: 95, possible: 100, categoryGrade: 95, missingCount: 0, droppedCount: 0 },
      ],
    },
  ];

  const forecasts: CourseForecast[] = [
    {
      courseId: "jor-precalc",
      courseName: "Pre-Calc",
      projectedFinalGrade: 94.5,
      projectedLetterGrade: "A",
      categoryTrends: [
        { groupId: "jp-tests", groupName: "Tests", weight: 40, averageScore: 92.5, gradedCount: 4, remainingCount: 1, riskScore: 5 },
      ],
      targets: makeTargets(94),
      riskCategory: null,
    },
    {
      courseId: "jor-phys",
      courseName: "Physics",
      projectedFinalGrade: 91.5,
      projectedLetterGrade: "A-",
      categoryTrends: [
        { groupId: "jph-tests", groupName: "Tests", weight: 35, averageScore: 90, gradedCount: 3, remainingCount: 1, riskScore: 10 },
      ],
      targets: makeTargets(91),
      riskCategory: null,
    },
    {
      courseId: "jor-eng",
      courseName: "English",
      projectedFinalGrade: 88.8,
      projectedLetterGrade: "B+",
      categoryTrends: [
        { groupId: "je-essays", groupName: "Essays", weight: 35, averageScore: 85, gradedCount: 4, remainingCount: 2, riskScore: 15 },
      ],
      targets: makeTargets(88),
      riskCategory: null,
    },
    {
      courseId: "jor-ush",
      courseName: "US History",
      projectedFinalGrade: 93.5,
      projectedLetterGrade: "A",
      categoryTrends: [
        { groupId: "jh-tests", groupName: "Tests", weight: 35, averageScore: 92.5, gradedCount: 3, remainingCount: 1, riskScore: 5 },
      ],
      targets: makeTargets(93),
      riskCategory: null,
    },
    {
      courseId: "jor-cs",
      courseName: "CS",
      projectedFinalGrade: 96.5,
      projectedLetterGrade: "A",
      categoryTrends: [
        { groupId: "jc-proj", groupName: "Projects", weight: 40, averageScore: 96.25, gradedCount: 4, remainingCount: 1, riskScore: 3 },
      ],
      targets: makeTargets(96),
      riskCategory: null,
    },
  ];

  const workload: WorkloadRadar = {
    periods: [
      {
        label: "This Week",
        assignments: [
          { assignmentId: "jor-w1", assignmentName: "Pre-Calc Problem Set", courseName: "Pre-Calc", courseId: "jor-precalc", categoryName: "Homework", categoryWeight: 25, dueAt: daysFromNow(2), pointsPossible: 30, estimatedEffort: 25, gradeImpact: 0.2, isHighImpact: false },
          { assignmentId: "jor-w2", assignmentName: "Physics Lab Report", courseName: "Physics", courseId: "jor-phys", categoryName: "Labs", categoryWeight: 25, dueAt: daysFromNow(4), pointsPossible: 50, estimatedEffort: 40, gradeImpact: 0.4, isHighImpact: false },
        ],
        totalEffort: 65,
        totalGradeImpact: 0.6,
      },
    ],
    totalUpcoming: 2,
    totalEffort: 65,
    highImpactCount: 0,
  };

  const jordanGrades = [94, 91, 88, 93, 96];
  const jordanGPA = Math.round((jordanGrades.reduce((s, g) => s + gpaFor(g), 0) / jordanGrades.length) * 100) / 100;

  const assignmentSummaries: AssignmentSnapshot[] = [
    { assignmentId: "jor-a1", assignmentName: "Pre-Calc Problem Set 11", courseId: "jor-precalc", courseName: "Pre-Calc", score: 95, missing: false, submitted: true },
    { assignmentId: "jor-a2", assignmentName: "Physics Lab Report 4", courseId: "jor-phys", courseName: "Physics", score: 91, missing: false, submitted: true },
    { assignmentId: "jor-a3", assignmentName: "English Essay 3", courseId: "jor-eng", courseName: "English", score: 86, missing: false, submitted: true },
    { assignmentId: "jor-a4", assignmentName: "US History Test 3", courseId: "jor-ush", courseName: "US History", score: 94, missing: false, submitted: true },
    { assignmentId: "jor-a5", assignmentName: "CS Project 4", courseId: "jor-cs", courseName: "CS", score: 98, missing: false, submitted: true },
  ];

  return {
    student: { id: "demo-jordan", name: "Jordan", source: "canvas" },
    data: {
      students: [{ id: "demo-jordan", name: "Jordan", source: "canvas" }],
      selectedStudent: { id: "demo-jordan", name: "Jordan", source: "canvas" },
      courses,
      todos: [],
      overallGPA: jordanGPA,
      totalMissing: 0,
      maxPotentialGPA: jordanGPA,
      summary: "All courses above 88%. No missing work. Trending up across the board.",
      forecasts,
      workload,
      assignmentSummaries,
    },
  };
}

/**
 * Generate mock snapshot history for demo mode.
 * Creates 5 snapshots over the past 4 weeks with realistic grade fluctuations.
 */
export function generateDemoSnapshots(): void {
  if (typeof window === "undefined") return;

  const STORAGE_KEY = "grade-optimizer-snapshots";
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as GradeSnapshot[];
      // If we already have demo snapshots, don't regenerate
      if (parsed.some((s) => s.studentId === "demo-sam")) return;
    }
  } catch { /* continue */ }

  const snapshots: GradeSnapshot[] = [];
  const now = Date.now();

  // Sam's grade trajectory (declining)
  const samHistory = [
    { daysAgo: 28, gpa: 3.14, courses: [
      { courseId: "sam-aphist", courseName: "AP History", currentGrade: 84.5, letterGrade: "B", missingCount: 0 },
      { courseId: "sam-eng", courseName: "English", currentGrade: 78, letterGrade: "C+", missingCount: 0 },
      { courseId: "sam-math", courseName: "Math", currentGrade: 86, letterGrade: "B", missingCount: 0 },
      { courseId: "sam-sci", courseName: "Science", currentGrade: 82, letterGrade: "B-", missingCount: 0 },
      { courseId: "sam-span", courseName: "Spanish", currentGrade: 90, letterGrade: "A-", missingCount: 0 },
    ], assignments: [
      { assignmentId: "sam-a1", assignmentName: "AP History Essay", courseId: "sam-aphist", courseName: "AP History", score: null, missing: false, submitted: false },
      { assignmentId: "sam-a3", assignmentName: "AP History Test 2", courseId: "sam-aphist", courseName: "AP History", score: null, missing: false, submitted: false },
      { assignmentId: "sam-a6", assignmentName: "Math Quiz 7", courseId: "sam-math", courseName: "Math", score: null, missing: false, submitted: false },
      { assignmentId: "sam-a7", assignmentName: "Science Lab Report", courseId: "sam-sci", courseName: "Science", score: null, missing: false, submitted: false },
    ]},
    { daysAgo: 21, gpa: 3.08, courses: [
      { courseId: "sam-aphist", courseName: "AP History", currentGrade: 83.8, letterGrade: "B", missingCount: 1 },
      { courseId: "sam-eng", courseName: "English", currentGrade: 76.5, letterGrade: "C+", missingCount: 0 },
      { courseId: "sam-math", courseName: "Math", currentGrade: 87, letterGrade: "B+", missingCount: 0 },
      { courseId: "sam-sci", courseName: "Science", currentGrade: 80, letterGrade: "B-", missingCount: 1 },
      { courseId: "sam-span", courseName: "Spanish", currentGrade: 90.5, letterGrade: "A-", missingCount: 0 },
    ], assignments: [
      { assignmentId: "sam-a1", assignmentName: "AP History Essay", courseId: "sam-aphist", courseName: "AP History", score: null, missing: true, submitted: false },
      { assignmentId: "sam-a3", assignmentName: "AP History Test 2", courseId: "sam-aphist", courseName: "AP History", score: null, missing: false, submitted: false },
      { assignmentId: "sam-a6", assignmentName: "Math Quiz 7", courseId: "sam-math", courseName: "Math", score: null, missing: false, submitted: false },
      { assignmentId: "sam-a7", assignmentName: "Science Lab Report", courseId: "sam-sci", courseName: "Science", score: null, missing: true, submitted: false },
    ]},
    { daysAgo: 14, gpa: 2.94, courses: [
      { courseId: "sam-aphist", courseName: "AP History", currentGrade: 82.5, letterGrade: "B-", missingCount: 1 },
      { courseId: "sam-eng", courseName: "English", currentGrade: 75, letterGrade: "C", missingCount: 1 },
      { courseId: "sam-math", courseName: "Math", currentGrade: 87.5, letterGrade: "B+", missingCount: 0 },
      { courseId: "sam-sci", courseName: "Science", currentGrade: 78, letterGrade: "C+", missingCount: 1 },
      { courseId: "sam-span", courseName: "Spanish", currentGrade: 91, letterGrade: "A-", missingCount: 0 },
    ], assignments: [
      { assignmentId: "sam-a1", assignmentName: "AP History Essay", courseId: "sam-aphist", courseName: "AP History", score: null, missing: true, submitted: false },
      { assignmentId: "sam-a3", assignmentName: "AP History Test 2", courseId: "sam-aphist", courseName: "AP History", score: 64, missing: false, submitted: true },
      { assignmentId: "sam-a6", assignmentName: "Math Quiz 7", courseId: "sam-math", courseName: "Math", score: 92, missing: false, submitted: true },
      { assignmentId: "sam-a7", assignmentName: "Science Lab Report", courseId: "sam-sci", courseName: "Science", score: null, missing: true, submitted: false },
    ]},
    { daysAgo: 7, gpa: 2.86, courses: [
      { courseId: "sam-aphist", courseName: "AP History", currentGrade: 81.8, letterGrade: "B-", missingCount: 2 },
      { courseId: "sam-eng", courseName: "English", currentGrade: 74.5, letterGrade: "C", missingCount: 1 },
      { courseId: "sam-math", courseName: "Math", currentGrade: 88, letterGrade: "B+", missingCount: 0 },
      { courseId: "sam-sci", courseName: "Science", currentGrade: 77, letterGrade: "C+", missingCount: 2 },
      { courseId: "sam-span", courseName: "Spanish", currentGrade: 91, letterGrade: "A-", missingCount: 0 },
    ], assignments: [
      { assignmentId: "sam-a1", assignmentName: "AP History Essay", courseId: "sam-aphist", courseName: "AP History", score: null, missing: true, submitted: false },
      { assignmentId: "sam-a2", assignmentName: "AP History DBQ Project", courseId: "sam-aphist", courseName: "AP History", score: null, missing: true, submitted: false },
      { assignmentId: "sam-a3", assignmentName: "AP History Test 2", courseId: "sam-aphist", courseName: "AP History", score: 64, missing: false, submitted: true },
      { assignmentId: "sam-a4", assignmentName: "English Reading Response", courseId: "sam-eng", courseName: "English", score: null, missing: true, submitted: false },
      { assignmentId: "sam-a6", assignmentName: "Math Quiz 7", courseId: "sam-math", courseName: "Math", score: 92, missing: false, submitted: true },
      { assignmentId: "sam-a7", assignmentName: "Science Lab Report", courseId: "sam-sci", courseName: "Science", score: null, missing: true, submitted: false },
      { assignmentId: "sam-a8", assignmentName: "Science Ecosystem Project", courseId: "sam-sci", courseName: "Science", score: null, missing: true, submitted: false },
    ]},
  ];

  for (const entry of samHistory) {
    snapshots.push({
      timestamp: new Date(now - entry.daysAgo * 86400000).toISOString(),
      studentId: "demo-sam",
      overallGPA: entry.gpa,
      totalMissing: entry.courses.reduce((s, c) => s + c.missingCount, 0),
      courses: entry.courses,
      assignments: entry.assignments,
    });
  }

  // Alex — steady with slight improvements
  const alexHistory = [
    { daysAgo: 28, gpa: 3.30, courses: [
      { courseId: "alex-chem", courseName: "Chemistry", currentGrade: 85.2, letterGrade: "B", missingCount: 0 },
      { courseId: "alex-bio", courseName: "Biology", currentGrade: 91, letterGrade: "A-", missingCount: 0 },
      { courseId: "alex-alg", courseName: "Algebra 2", currentGrade: 82, letterGrade: "B-", missingCount: 0 },
      { courseId: "alex-whist", courseName: "World History", currentGrade: 88, letterGrade: "B+", missingCount: 0 },
      { courseId: "alex-art", courseName: "Art", currentGrade: 94, letterGrade: "A", missingCount: 0 },
    ], assignments: [
      { assignmentId: "alex-a1", assignmentName: "Chemistry Worksheet", courseId: "alex-chem", courseName: "Chemistry", score: null, missing: false, submitted: false },
      { assignmentId: "alex-a4", assignmentName: "Algebra 2 Test 3", courseId: "alex-alg", courseName: "Algebra 2", score: null, missing: false, submitted: false },
    ]},
    { daysAgo: 14, gpa: 3.34, courses: [
      { courseId: "alex-chem", courseName: "Chemistry", currentGrade: 86.5, letterGrade: "B+", missingCount: 0 },
      { courseId: "alex-bio", courseName: "Biology", currentGrade: 91.5, letterGrade: "A-", missingCount: 0 },
      { courseId: "alex-alg", courseName: "Algebra 2", currentGrade: 82.5, letterGrade: "B-", missingCount: 0 },
      { courseId: "alex-whist", courseName: "World History", currentGrade: 88.5, letterGrade: "B+", missingCount: 0 },
      { courseId: "alex-art", courseName: "Art", currentGrade: 94.5, letterGrade: "A", missingCount: 0 },
    ], assignments: [
      { assignmentId: "alex-a1", assignmentName: "Chemistry Worksheet", courseId: "alex-chem", courseName: "Chemistry", score: null, missing: false, submitted: false },
      { assignmentId: "alex-a4", assignmentName: "Algebra 2 Test 3", courseId: "alex-alg", courseName: "Algebra 2", score: 81, missing: false, submitted: true },
    ]},
    { daysAgo: 7, gpa: 3.36, courses: [
      { courseId: "alex-chem", courseName: "Chemistry", currentGrade: 87, letterGrade: "B+", missingCount: 1 },
      { courseId: "alex-bio", courseName: "Biology", currentGrade: 92, letterGrade: "A-", missingCount: 0 },
      { courseId: "alex-alg", courseName: "Algebra 2", currentGrade: 83, letterGrade: "B", missingCount: 0 },
      { courseId: "alex-whist", courseName: "World History", currentGrade: 89, letterGrade: "B+", missingCount: 1 },
      { courseId: "alex-art", courseName: "Art", currentGrade: 95, letterGrade: "A", missingCount: 0 },
    ], assignments: [
      { assignmentId: "alex-a1", assignmentName: "Chemistry Worksheet", courseId: "alex-chem", courseName: "Chemistry", score: null, missing: true, submitted: false },
      { assignmentId: "alex-a4", assignmentName: "Algebra 2 Test 3", courseId: "alex-alg", courseName: "Algebra 2", score: 81, missing: false, submitted: true },
      { assignmentId: "alex-a5", assignmentName: "History DBQ", courseId: "alex-whist", courseName: "World History", score: null, missing: true, submitted: false },
    ]},
  ];

  for (const entry of alexHistory) {
    snapshots.push({
      timestamp: new Date(now - entry.daysAgo * 86400000).toISOString(),
      studentId: "demo-alex",
      overallGPA: entry.gpa,
      totalMissing: entry.courses.reduce((s, c) => s + c.missingCount, 0),
      courses: entry.courses,
      assignments: entry.assignments,
    });
  }

  // Jordan — stable high performer
  const jordanHistory = [
    { daysAgo: 28, gpa: 3.76, courses: [
      { courseId: "jor-precalc", courseName: "Pre-Calc", currentGrade: 93, letterGrade: "A", missingCount: 0 },
      { courseId: "jor-phys", courseName: "Physics", currentGrade: 90, letterGrade: "A-", missingCount: 0 },
      { courseId: "jor-eng", courseName: "English", currentGrade: 87, letterGrade: "B+", missingCount: 0 },
      { courseId: "jor-ush", courseName: "US History", currentGrade: 92, letterGrade: "A-", missingCount: 0 },
      { courseId: "jor-cs", courseName: "CS", currentGrade: 95, letterGrade: "A", missingCount: 0 },
    ]},
    { daysAgo: 14, gpa: 3.80, courses: [
      { courseId: "jor-precalc", courseName: "Pre-Calc", currentGrade: 93.5, letterGrade: "A", missingCount: 0 },
      { courseId: "jor-phys", courseName: "Physics", currentGrade: 90.5, letterGrade: "A-", missingCount: 0 },
      { courseId: "jor-eng", courseName: "English", currentGrade: 87.5, letterGrade: "B+", missingCount: 0 },
      { courseId: "jor-ush", courseName: "US History", currentGrade: 92.5, letterGrade: "A-", missingCount: 0 },
      { courseId: "jor-cs", courseName: "CS", currentGrade: 95.5, letterGrade: "A", missingCount: 0 },
    ]},
    { daysAgo: 7, gpa: 3.82, courses: [
      { courseId: "jor-precalc", courseName: "Pre-Calc", currentGrade: 94, letterGrade: "A", missingCount: 0 },
      { courseId: "jor-phys", courseName: "Physics", currentGrade: 91, letterGrade: "A-", missingCount: 0 },
      { courseId: "jor-eng", courseName: "English", currentGrade: 88, letterGrade: "B+", missingCount: 0 },
      { courseId: "jor-ush", courseName: "US History", currentGrade: 93, letterGrade: "A", missingCount: 0 },
      { courseId: "jor-cs", courseName: "CS", currentGrade: 96, letterGrade: "A", missingCount: 0 },
    ]},
  ];

  for (const entry of jordanHistory) {
    snapshots.push({
      timestamp: new Date(now - entry.daysAgo * 86400000).toISOString(),
      studentId: "demo-jordan",
      overallGPA: entry.gpa,
      totalMissing: 0,
      courses: entry.courses,
    });
  }

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const existingSnapshots: GradeSnapshot[] = existing ? JSON.parse(existing) : [];
    // Remove any old demo snapshots and add fresh ones
    const nonDemo = existingSnapshots.filter((s) => !s.studentId.startsWith("demo-"));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...nonDemo, ...snapshots]));
  } catch { /* localStorage unavailable */ }
}

export function generateDemoChildren(): ChildData[] {
  return [buildSam(), buildAlex(), buildJordan()];
}

// === Academic History Demo Data ===

const DEMO_TERMS = [
  { id: "t-fall-2024", name: "Fall 2024", startAt: "2024-08-15", endAt: "2024-12-20" },
  { id: "t-spring-2025", name: "Spring 2025", startAt: "2025-01-10", endAt: "2025-05-25" },
  { id: "t-fall-2025", name: "Fall 2025", startAt: "2025-08-15", endAt: "2025-12-20" },
  { id: "t-spring-2026", name: "Spring 2026", startAt: "2026-01-10", endAt: "2026-05-25" },
];

function makeHistoryCourses(
  studentId: string,
  courseData: { name: string; grades: number[] }[]
) {
  return courseData.flatMap((course) =>
    course.grades.map((grade, i) => ({
      id: `${studentId}-${course.name.toLowerCase().replace(/\s+/g, "-")}-${i}`,
      name: course.name,
      finalScore: grade,
      currentScore: i === course.grades.length - 1 ? grade : null,
      isActive: i === course.grades.length - 1,
      term: DEMO_TERMS[i],
    }))
  );
}

export function buildDemoHistoryData(): AcademicHistoryResponse[] {
  // Sam: declining in STEM, strong in languages
  const samCourses = makeHistoryCourses("demo-sam", [
    { name: "Spanish III", grades: [90, 91, 89, 91] },
    { name: "Algebra II", grades: [86, 87, 88, 88] },
    { name: "AP Biology", grades: [78, 75, 77, 76] },
    { name: "US History", grades: [85, 83, 82, 81] },
    { name: "English 11", grades: [76, 75, 74, 74] },
  ]);

  // Alex: improving in science, flat in math
  const alexCourses = makeHistoryCourses("demo-alex", [
    { name: "Art Studio", grades: [94, 95, 93, 95] },
    { name: "Chemistry", grades: [89, 90, 91, 92] },
    { name: "Geometry", grades: [82, 83, 81, 83] },
    { name: "World History", grades: [88, 87, 89, 89] },
  ]);

  // Jordan: strong everywhere, CS standout
  const jordanCourses = makeHistoryCourses("demo-jordan", [
    { name: "AP Computer Science", grades: [95, 96, 97, 96] },
    { name: "Pre-Calculus", grades: [93, 93, 94, 94] },
    { name: "Physics", grades: [90, 91, 91, 91] },
    { name: "English 12", grades: [86, 87, 88, 88] },
    { name: "AP Government", grades: [92, 92, 93, 93] },
  ]);

  return [
    buildAcademicHistory("demo-sam", "Sam", samCourses, {}),
    buildAcademicHistory("demo-alex", "Alex", alexCourses, {}),
    buildAcademicHistory("demo-jordan", "Jordan", jordanCourses, {}),
  ];
}

// === Engagement Demo Data ===

function weeksAgo(weeks: number, dayOfWeek: number, hour: number = 23, minute: number = 59): string {
  const now = new Date();
  // Get most recent Monday
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  // Go back N weeks and add dayOfWeek offset (0=Mon, 1=Tue, ..., 4=Fri)
  const target = new Date(monday);
  target.setDate(monday.getDate() - weeks * 7 + dayOfWeek);
  target.setHours(hour, minute, 0, 0);
  return target.toISOString();
}

function hoursBeforeDue(dueAt: string, hours: number): string {
  return new Date(Date.parse(dueAt) - hours * 3_600_000).toISOString();
}

function hoursAfterDue(dueAt: string, hours: number): string {
  return new Date(Date.parse(dueAt) + hours * 3_600_000).toISOString();
}

function makeEngagementAssignment(
  id: string,
  name: string,
  dueAt: string,
  pointsPossible: number,
  opts: {
    submittedAt?: string | null;
    score?: number | null;
    missing?: boolean;
    late?: boolean;
    secondsLate?: number;
  }
): Assignment {
  const missing = opts.missing ?? false;
  const submitted = !!opts.submittedAt;
  return {
    id,
    name,
    dueAt,
    pointsPossible,
    score: opts.score ?? null,
    submitted,
    missing,
    late: opts.late ?? false,
    excused: false,
    omitFromFinalGrade: false,
    assignmentGroupId: "eg-hw",
    submittedAt: opts.submittedAt ?? null,
    secondsLate: opts.secondsLate ?? 0,
  };
}

function buildEngagementSam(): { studentId: string; studentName: string; courses: Course[] } {
  const assignments: Assignment[] = [];
  let idx = 0;

  // 8 weeks of assignments, 5 per week (Mon-Fri)
  // Weeks 1-3: early submitter, good scores
  for (let w = 7; w >= 5; w--) {
    for (let d = 0; d < 5; d++) {
      const due = weeksAgo(w, d);
      const earlyHours = 24 + Math.random() * 24; // 24-48h early
      const score = 78 + Math.random() * 10; // 78-88
      assignments.push(makeEngagementAssignment(
        `sam-e${idx}`, `Assignment ${idx + 1}`, due, 100,
        { submittedAt: hoursBeforeDue(due, earlyHours), score: Math.round(score), late: false }
      ));
      idx++;
    }
  }

  // Weeks 4-5: submitting closer to deadline, slightly lower scores
  for (let w = 4; w >= 3; w--) {
    for (let d = 0; d < 5; d++) {
      const due = weeksAgo(w, d);
      const earlyHours = 2 + Math.random() * 4; // 2-6h early
      const score = 72 + Math.random() * 10; // 72-82
      assignments.push(makeEngagementAssignment(
        `sam-e${idx}`, `Assignment ${idx + 1}`, due, 100,
        { submittedAt: hoursBeforeDue(due, earlyHours), score: Math.round(score), late: false }
      ));
      idx++;
    }
  }

  // Weeks 6-7: last minute or late, some missing, Mon/Fri worst
  for (let w = 2; w >= 1; w--) {
    for (let d = 0; d < 5; d++) {
      const due = weeksAgo(w, d);
      // Monday (d=0) and Friday (d=4) are worst
      if ((d === 0 || d === 4) && Math.random() > 0.4) {
        // Missing on Mon/Fri
        assignments.push(makeEngagementAssignment(
          `sam-e${idx}`, `Assignment ${idx + 1}`, due, 100,
          { submittedAt: null, missing: true }
        ));
      } else {
        const lateChance = Math.random();
        if (lateChance > 0.5) {
          // Late
          const lateHours = 1 + Math.random() * 8;
          const score = 65 + Math.random() * 10;
          assignments.push(makeEngagementAssignment(
            `sam-e${idx}`, `Assignment ${idx + 1}`, due, 100,
            { submittedAt: hoursAfterDue(due, lateHours), score: Math.round(score), late: true, secondsLate: Math.round(lateHours * 3600) }
          ));
        } else {
          // Just barely on time
          const earlyHours = Math.random() * 2;
          const score = 65 + Math.random() * 10;
          assignments.push(makeEngagementAssignment(
            `sam-e${idx}`, `Assignment ${idx + 1}`, due, 100,
            { submittedAt: hoursBeforeDue(due, earlyHours), score: Math.round(score), late: false }
          ));
        }
      }
      idx++;
    }
  }

  // Week 8 (current): mostly missing, late when submitted
  for (let d = 0; d < 5; d++) {
    const due = weeksAgo(0, d);
    if (Date.parse(due) > Date.now()) break; // Don't include future assignments
    if (d === 0 || d === 3 || d === 4) {
      // Missing
      assignments.push(makeEngagementAssignment(
        `sam-e${idx}`, `Assignment ${idx + 1}`, due, 100,
        { submittedAt: null, missing: true }
      ));
    } else {
      // Late
      const lateHours = 2 + Math.random() * 6;
      const score = 60 + Math.random() * 10;
      assignments.push(makeEngagementAssignment(
        `sam-e${idx}`, `Assignment ${idx + 1}`, due, 100,
        { submittedAt: hoursAfterDue(due, lateHours), score: Math.round(score), late: true, secondsLate: Math.round(lateHours * 3600) }
      ));
    }
    idx++;
  }

  return {
    studentId: "demo-sam",
    studentName: "Sam",
    courses: [{
      id: "sam-eng-course",
      name: "English",
      currentScore: 72,
      finalScore: 68,
      source: "canvas",
      assignmentGroups: [{
        id: "eg-hw",
        name: "Assignments",
        weight: 100,
        rules: { dropLowest: 0, dropHighest: 0, neverDrop: [] },
        assignments,
      }],
    }],
  };
}

function buildEngagementAlex(): { studentId: string; studentName: string; courses: Course[] } {
  const assignments: Assignment[] = [];
  let idx = 0;

  // 8 weeks, generally on-time but Wed (d=2) and Fri (d=4) consistently late/missing
  for (let w = 7; w >= 0; w--) {
    for (let d = 0; d < 5; d++) {
      const due = weeksAgo(w, d);
      if (Date.parse(due) > Date.now()) break;

      if (d === 2 || d === 4) {
        // Wednesday and Friday: late or missing
        if (Math.random() > 0.6) {
          // Missing
          assignments.push(makeEngagementAssignment(
            `alex-e${idx}`, `Assignment ${idx + 1}`, due, 100,
            { submittedAt: null, missing: true }
          ));
        } else {
          // Late
          const lateHours = 2 + Math.random() * 10;
          const score = 82 + Math.random() * 6;
          assignments.push(makeEngagementAssignment(
            `alex-e${idx}`, `Assignment ${idx + 1}`, due, 100,
            { submittedAt: hoursAfterDue(due, lateHours), score: Math.round(score), late: true, secondsLate: Math.round(lateHours * 3600) }
          ));
        }
      } else {
        // Mon, Tue, Thu: on-time, good scores
        const earlyHours = 12 + Math.random() * 12; // 12-24h early
        const score = 82 + Math.random() * 6; // 82-88, stable
        assignments.push(makeEngagementAssignment(
          `alex-e${idx}`, `Assignment ${idx + 1}`, due, 100,
          { submittedAt: hoursBeforeDue(due, earlyHours), score: Math.round(score), late: false }
        ));
      }
      idx++;
    }
  }

  return {
    studentId: "demo-alex",
    studentName: "Alex",
    courses: [{
      id: "alex-chem-course",
      name: "Chemistry",
      currentScore: 85,
      finalScore: 83,
      source: "canvas",
      assignmentGroups: [{
        id: "eg-hw",
        name: "Assignments",
        weight: 100,
        rules: { dropLowest: 0, dropHighest: 0, neverDrop: [] },
        assignments,
      }],
    }],
  };
}

function buildEngagementJordan(): { studentId: string; studentName: string; courses: Course[] } {
  const assignments: Assignment[] = [];
  let idx = 0;

  // 8 weeks, consistently early, good scores, slight positive trend
  for (let w = 7; w >= 0; w--) {
    for (let d = 0; d < 5; d++) {
      const due = weeksAgo(w, d);
      if (Date.parse(due) > Date.now()) break;

      // Gets slightly earlier over time
      const baseEarly = 24 + (7 - w) * 3; // starts 24h, trends to 45h+
      const earlyHours = baseEarly + Math.random() * 24;
      const score = 88 + Math.random() * 8; // 88-96
      assignments.push(makeEngagementAssignment(
        `jor-e${idx}`, `Assignment ${idx + 1}`, due, 100,
        { submittedAt: hoursBeforeDue(due, earlyHours), score: Math.round(score), late: false }
      ));
      idx++;
    }
  }

  return {
    studentId: "demo-jordan",
    studentName: "Jordan",
    courses: [{
      id: "jor-precalc-course",
      name: "Pre-Calc",
      currentScore: 94,
      finalScore: 94,
      source: "canvas",
      assignmentGroups: [{
        id: "eg-hw",
        name: "Assignments",
        weight: 100,
        rules: { dropLowest: 0, dropHighest: 0, neverDrop: [] },
        assignments,
      }],
    }],
  };
}

export function generateEngagementDemoData(): { studentId: string; studentName: string; courses: Course[] }[] {
  return [buildEngagementSam(), buildEngagementAlex(), buildEngagementJordan()];
}

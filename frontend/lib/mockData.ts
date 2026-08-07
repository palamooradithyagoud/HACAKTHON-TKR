// lib/mockData.ts

export interface MockStudent {
  id: string;
  name: string;
  roll_number: string;
  section: string;
  department: string;
  year: string;
  academic_year: string;
  attendance_percentage: number;
  coding_score: number;
  placement_readiness_score: number;
  faculty_notes: string;
  ai_insights: {
    risk_level: "high" | "low";
    risk_reasons: string[];
  };
  leetcode_handle: string;
  github_handle: string;
  assignment_history: any[];
  timeline: any[];
  unsubmitted_assignments: string[];
}

export const DEFAULT_MOCK_STUDENTS: MockStudent[] = [
  {
    id: "CSM1A001",
    name: "Aarav Reddy",
    roll_number: "CSM1A001",
    section: "Section A",
    department: "CSM",
    year: "4",
    academic_year: "4th Year",
    attendance_percentage: 85.0,
    coding_score: 8100,
    placement_readiness_score: 81.0,
    faculty_notes: "Strong in Data Structures and Algorithms.",
    ai_insights: { risk_level: "low", risk_reasons: [] },
    leetcode_handle: "csm1a001_lc",
    github_handle: "csm1a001_gh",
    assignment_history: [],
    timeline: [{ date: "2026-08-07", title: "Account Active", description: "Enrolled in platform." }],
    unsubmitted_assignments: []
  },
  {
    id: "CSM1A002",
    name: "Vivaan Sharma",
    roll_number: "CSM1A002",
    section: "Section A",
    department: "CSM",
    year: "4",
    academic_year: "4th Year",
    attendance_percentage: 68.0,
    coding_score: 8080,
    placement_readiness_score: 80.8,
    faculty_notes: "Needs attendance improvement.",
    ai_insights: { risk_level: "high", risk_reasons: ["Attendance below 75%"] },
    leetcode_handle: "csm1a002_lc",
    github_handle: "csm1a002_gh",
    assignment_history: [],
    timeline: [{ date: "2026-08-07", title: "Account Active", description: "Enrolled in platform." }],
    unsubmitted_assignments: ["Lab 3"]
  },
  {
    id: "CSM1A003",
    name: "Aditya Verma",
    roll_number: "CSM1A003",
    section: "Section A",
    department: "CSM",
    year: "4",
    academic_year: "4th Year",
    attendance_percentage: 80.0,
    coding_score: 7644,
    placement_readiness_score: 76.4,
    faculty_notes: "Consistent learner.",
    ai_insights: { risk_level: "low", risk_reasons: [] },
    leetcode_handle: "csm1a003_lc",
    github_handle: "csm1a003_gh",
    assignment_history: [],
    timeline: [{ date: "2026-08-07", title: "Account Active", description: "Enrolled in platform." }],
    unsubmitted_assignments: []
  },
  {
    id: "CSM1A004",
    name: "Arjun Patel",
    roll_number: "CSM1A004",
    section: "Section A",
    department: "CSM",
    year: "4",
    academic_year: "4th Year",
    attendance_percentage: 68.0,
    coding_score: 10536,
    placement_readiness_score: 100.0,
    faculty_notes: "High coding skills.",
    ai_insights: { risk_level: "low", risk_reasons: [] },
    leetcode_handle: "csm1a004_lc",
    github_handle: "csm1a004_gh",
    assignment_history: [],
    timeline: [{ date: "2026-08-07", title: "Account Active", description: "Enrolled in platform." }],
    unsubmitted_assignments: []
  },
  {
    id: "CSM1A005",
    name: "Sai Kumar",
    roll_number: "CSM1A005",
    section: "Section A",
    department: "CSM",
    year: "4",
    academic_year: "4th Year",
    attendance_percentage: 73.0,
    coding_score: 7217,
    placement_readiness_score: 72.2,
    faculty_notes: "Active participant.",
    ai_insights: { risk_level: "low", risk_reasons: [] },
    leetcode_handle: "csm1a005_lc",
    github_handle: "csm1a005_gh",
    assignment_history: [],
    timeline: [{ date: "2026-08-07", title: "Account Active", description: "Enrolled in platform." }],
    unsubmitted_assignments: []
  }
];

export const generateMockStudents = (): MockStudent[] => {
  return DEFAULT_MOCK_STUDENTS;
};

// Singleton instance to ensure same data across components in memory
let cachedStudents: MockStudent[] | null = null;

export const getSharedMockStudents = () => {
  if (!cachedStudents) {
    cachedStudents = generateMockStudents();
  }
  return cachedStudents;
};

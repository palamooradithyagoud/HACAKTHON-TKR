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

export const generateMockStudents = (): MockStudent[] => {
  return [];
};

// Singleton instance to ensure same data across components in memory
let cachedStudents: MockStudent[] | null = null;

export const getSharedMockStudents = () => {
  if (!cachedStudents) {
    cachedStudents = generateMockStudents();
  }
  return cachedStudents;
};

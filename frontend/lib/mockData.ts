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
  const students: MockStudent[] = [];
  const years = [1, 2, 3, 4];
  const depts = ["CSE", "CSM"];
  const sections = ["A", "B"];
  
  let idCounter = 1;
  years.forEach(year => {
    depts.forEach(dept => {
      sections.forEach(section => {
        for (let i = 1; i <= 5; i++) {
          const attendance = Math.floor(Math.random() * 40) + 60; // 60-100%
          const codingScore = Math.floor(Math.random() * 600) + 200; // 200-800
          const placement = Math.floor(Math.random() * 50) + 50; // 50-100%
          
          const isRisk = attendance < 75 || codingScore < 400;
          const riskReasons = [];
          if (attendance < 75) riskReasons.push("Attendance is below 75% threshold.");
          if (codingScore < 400) riskReasons.push("Coding performance is below average.");

          // Randomly assign unsubmitted assignments (about 20% of students)
          const hasMissingAssignment = Math.random() < 0.2;
          const unsubmitted = hasMissingAssignment ? (Math.random() < 0.5 ? ["Lab 3"] : ["Midterm Project"]) : [];

          students.push({
            id: `STU${year}${dept}${section}${i}`,
            name: `Student ${idCounter} (${dept})`,
            roll_number: `22XX1A${dept === 'CSE' ? '05' : '06'}${idCounter.toString().padStart(2, '0')}`,
            section,
            department: dept,
            year: year.toString(),
            academic_year: `Year ${year}`,
            attendance_percentage: attendance,
            coding_score: codingScore,
            placement_readiness_score: placement,
            faculty_notes: "",
            ai_insights: {
              risk_level: isRisk ? "high" : "low",
              risk_reasons: riskReasons
            },
            leetcode_handle: `student${idCounter}_lc`,
            github_handle: `student${idCounter}_gh`,
            unsubmitted_assignments: unsubmitted,
            assignment_history: [
              { submission_id: 1, title: "Data Structures Lab 1", status: "graded", marks_obtained: Math.floor(Math.random() * 5) + 5, max_marks: 10, subject: "DSA" },
              { submission_id: 2, title: "Mid Term Evaluation", status: "graded", marks_obtained: Math.floor(Math.random() * 20) + 10, max_marks: 30, subject: dept }
            ],
            timeline: [
              { title: "Submitted Assignment", description: "Completed DSA Lab 1 on time." },
              { title: "Platform Joined", description: "Linked LeetCode account." }
            ]
          });
          idCounter++;
        }
      });
    });
  });
  return students;
};

// Singleton instance to ensure same data across components in memory
let cachedStudents: MockStudent[] | null = null;

export const getSharedMockStudents = () => {
  if (!cachedStudents) {
    cachedStudents = generateMockStudents();
  }
  return cachedStudents;
};

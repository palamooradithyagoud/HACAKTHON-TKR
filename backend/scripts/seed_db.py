import os
import json
import random

def seed():
    years = [1, 2, 3, 4]
    depts = ["CSE", "CSM"]
    sections = ["A", "B"]
    
    students = []
    id_counter = 1
    
    # We want a stable random seed so that scores are consistent if re-run
    random.seed(42)
    
    for year in years:
        for dept in depts:
            for section in sections:
                for i in range(1, 6):
                    attendance = random.randint(60, 100)
                    coding_score = random.randint(200, 800)
                    placement = random.randint(50, 100)
                    
                    is_risk = attendance < 75 or coding_score < 400
                    risk_reasons = []
                    if attendance < 75:
                        risk_reasons.append("Attendance is below 75% threshold.")
                    if coding_score < 400:
                        risk_reasons.append("Coding performance is below average.")
                        
                    has_missing = random.random() < 0.2
                    unsubmitted = ["Lab 3"] if has_missing else []
                    
                    student_id = f"STU{year}{dept}{section}{i}"
                    students.append({
                        "id": student_id,
                        "name": f"Student {id_counter} ({dept})",
                        "roll_number": f"22XX1A{'05' if dept == 'CSE' else '06'}{str(id_counter).zfill(2)}",
                        "section": section,
                        "department": dept,
                        "year": str(year),
                        "academic_year": f"Year {year}",
                        "attendance_percentage": float(attendance),
                        "coding_score": coding_score,
                        "placement_readiness_score": float(placement),
                        "faculty_notes": "",
                        "leetcode_handle": f"student{id_counter}_lc",
                        "github_handle": f"student{id_counter}_gh",
                        "certifications": [],
                        "projects": [],
                        "timeline": [
                            { "date": "2026-08-05", "title": "Platform Joined", "description": "Linked LeetCode account." }
                        ]
                    })
                    id_counter += 1

    classes = [
        {
            "id": 1,
            "subject": "Data Structures & Algorithms",
            "department": "CSE",
            "year": "3",
            "section": "A",
            "time": "09:00 AM - 10:00 AM",
            "room": "Seminar Hall-2"
        },
        {
            "id": 2,
            "subject": "System Design & Architecture",
            "department": "CSE",
            "year": "3",
            "section": "B",
            "time": "11:30 AM - 12:30 PM",
            "room": "Lab-4"
        },
        {
            "id": 3,
            "subject": "Web Development Lab",
            "department": "CSE",
            "year": "2",
            "section": "A",
            "time": "02:00 PM - 04:00 PM",
            "room": "Programming Lab"
        }
    ]

    assignments = [
        {
            "id": 1,
            "title": "Advanced Trees & Graphs Implementation",
            "description": "Implement an AVL Tree and a Graph traversal (DFS/BFS) using adjacency list representation. Code should be written in clean Python or C++.",
            "subject": "Data Structures & Algorithms",
            "deadline": "2026-08-10T23:59:00Z",
            "max_marks": 10,
            "attachments": "dsa_trees_graphs_handout.pdf",
            "created_at": "2026-08-01T10:00:00Z"
        },
        {
            "id": 2,
            "title": "Design a Scalable URL Shortener System",
            "description": "Submit a system design document outlining the architecture of a URL shortener service (like Bitly). Explain capacity estimation, database choice, API contracts, caching, and rate limiting.",
            "subject": "System Design & Architecture",
            "deadline": "2026-08-15T23:59:00Z",
            "max_marks": 20,
            "attachments": "url_shortener_guide.pdf",
            "created_at": "2026-08-03T11:00:00Z"
        }
    ]

    submissions = []
    sub_id = 1
    
    # Pre-populate submissions for Assignment 1 (DSA - Year 3, CSE, Section A)
    # Students are STU3CSEA1 to STU3CSEA5
    for i in range(1, 6):
        student_id = f"STU3CSEA{i}"
        status = "graded" if i in (1, 5) else "pending"
        marks = 9.0 if i == 1 else (8.0 if i == 5 else 0.0)
        feedback = "Perfect logic and graph traversals." if i == 1 else ("Good effort, check AVL balancing logic." if i == 5 else "")
        sub_content = f"Attached code implementation in Python for BFS/DFS traversal."
        
        submissions.append({
            "id": sub_id,
            "assignment_id": 1,
            "student_id": student_id,
            "submitted_at": "2026-08-05T14:30:00Z",
            "status": status,
            "marks_obtained": marks,
            "feedback": feedback,
            "submission_content": sub_content
        })
        sub_id += 1

    # Pre-populate submissions for Assignment 2 (System Design - Year 3, CSE, Section B)
    # Students are STU3CSEB1 to STU3CSEB5
    for i in range(1, 6):
        student_id = f"STU3CSEB{i}"
        status = "graded" if i in (1, 3) else "pending"
        marks = 18.0 if i == 1 else (15.0 if i == 3 else 0.0)
        feedback = "Excellent scaling strategies and DB choices." if i == 1 else ("Overall good design, but explain caching strategies more." if i == 3 else "")
        sub_content = f"System design PDF document uploaded."
        
        submissions.append({
            "id": sub_id,
            "assignment_id": 2,
            "student_id": student_id,
            "submitted_at": "2026-08-06T10:00:00Z",
            "status": status,
            "marks_obtained": marks,
            "feedback": feedback,
            "submission_content": sub_content
        })
        sub_id += 1

    # Empty/base attendance records
    attendance_records = []
    
    # Mock learning materials
    learning_materials = [
        {
            "id": 1,
            "title": "System Design Primer - Scalability Lecture Slides",
            "type": "ppt",
            "url": "https://example.com/materials/system_design_scalability.pptx",
            "subject": "System Design & Architecture",
            "semester": "5th Semester",
            "department": "CSE",
            "academic_year": "3rd Year",
            "uploaded_at": "2026-08-04T09:00:00Z"
        },
        {
            "id": 2,
            "title": "DSA Cheat Sheet - Trees, Graphs & Dynamic Programming",
            "type": "pdf",
            "url": "https://example.com/materials/dsa_cheatsheet.pdf",
            "subject": "Data Structures & Algorithms",
            "semester": "5th Semester",
            "department": "CSE",
            "academic_year": "3rd Year",
            "uploaded_at": "2026-08-05T14:20:00Z"
        }
    ]

    announcements = [
        {
            "id": 1,
            "title": "Internal Hackathon 2026 Registration Open",
            "content": "All CSE students in 3rd year are required to form groups of 3-4 and register for the upcoming Hackathon on or before August 15.",
            "target_scope": "department",
            "target_value": "CSE",
            "created_at": "2026-08-04T12:00:00Z"
        }
    ]

    messages = [
        {
            "id": 1,
            "sender_id": "faculty_demo",
            "receiver_id": "STU3CSEA2",
            "content": "Please make sure you submit the graph implementation assignment on time.",
            "created_at": "2026-08-04T10:00:00Z",
            "is_read": True
        }
    ]

    db_data = {
        "students": students,
        "classes": classes,
        "assignments": assignments,
        "submissions": submissions,
        "attendance_records": attendance_records,
        "learning_materials": learning_materials,
        "announcements": announcements,
        "messages": messages
    }

    db_path = os.path.join(os.path.dirname(__file__), "..", "data", "faculty_db.json")
    with open(db_path, "w") as f:
        json.dump(db_data, f, indent=2)
    print("Database seeded successfully with 80 students.")

if __name__ == "__main__":
    seed()

import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.services.supabase_service import get_supabase
from backend.services.auth_service import get_current_user_id, get_session_or_user_id
from backend.services.groq_service import chat_with_groq
from backend.services.score_calculator import compute_overall_coding_score
from backend.services import messaging_service

logger = logging.getLogger(__name__)

import time

router = APIRouter(prefix="/api/faculty", tags=["faculty"])

DB_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "faculty_db.json")

_FACULTY_DB_CACHE = {"data": None, "timestamp": 0.0}

def invalidate_faculty_cache():
    _FACULTY_DB_CACHE["data"] = None

def load_db(force_refresh: bool = False) -> Dict[str, Any]:
    """Helper to read database data and merge registered Supabase student profiles with 30s TTL cache for sub-10ms latency."""
    now = time.time()
    if not force_refresh and _FACULTY_DB_CACHE["data"] is not None and (now - _FACULTY_DB_CACHE["timestamp"]) < 30.0:
        return _FACULTY_DB_CACHE["data"]
    db_data = {
        "students": [],
        "classes": [],
        "assignments": [],
        "submissions": [],
        "attendance_records": [],
        "learning_materials": [],
        "announcements": [],
        "messages": []
    }
    try:
        if os.path.exists(DB_FILE):
            with open(DB_FILE, "r") as f:
                content = json.load(f)
                db_data.update(content)
    except Exception as e:
        logger.error(f"Error loading faculty DB: {e}")

    # 1. Load dataset students from list_all_students() if available
    dataset_students_map = {}
    try:
        from backend.services.student_auth import list_all_students
        dataset_students = list_all_students()
        if dataset_students:
            for s in dataset_students:
                roll = s.get("roll_number", "")
                name = s.get("full_name", roll)
                dept = s.get("department", "CSE")
                att = float(s.get("attendance", 0))
                coding_score = int(s.get("coding_score", 0))
                
                dataset_students_map[roll] = {
                    "id": roll,
                    "roll_number": roll,
                    "name": name,
                    "department": dept,
                    "section": s.get("section", "Section A"),
                    "year": str(s.get("year", "4")),
                    "academic_year": str(s.get("academic_year", "4th Year")),
                    "college": s.get("college", "TKR College of Engineering & Technology"),
                    "email": s.get("email", ""),
                    "target_role": s.get("target_role", "Software Engineer"),
                    "leetcode_handle": f"{roll.lower()}_lc",
                    "github_handle": f"{roll.lower()}_gh",
                    "attendance_percentage": att,
                    "coding_score": coding_score,
                    "leetcode_solved": s.get("leetcode_solved", 0),
                    "gfg_solved": s.get("gfg_solved", 0),
                    "codechef_solved": s.get("codechef_solved", 0),
                    "hackerrank_score": s.get("hackerrank_score", 0),
                    "codeforces_solved": s.get("codeforces_solved", 0),
                    "github_repos": s.get("github_repos", 0),
                    "github_commits": s.get("github_commits", 0),
                    "placement_readiness_score": min(100.0, round((coding_score / 100.0), 1)),
                    "faculty_notes": "",
                    "timeline": [
                        {"date": datetime.now().strftime("%Y-%m-%d"), "title": "Account Active", "description": "Enrolled in SkillsCatalyst platform."}
                    ]
                }
    except Exception as e:
        logger.warning(f"Failed to load dataset student profiles for faculty: {e}")

    # 2. Dynamically fetch real registered students from Supabase DB table in ONE bulk query
    sb = get_supabase()
    supabase_students = []
    if sb:
        try:
            res_acad = sb.from_("user_academic_profile").select("*").execute()
            if res_acad.data:
                # Bulk fetch all coding profiles in 1 single query instead of N loop queries!
                coding_map = {}
                try:
                    res_code_all = sb.from_("user_coding_profiles").select("*").execute()
                    if res_code_all.data:
                        for c_row in res_code_all.data:
                            c_uid = c_row.get("user_id")
                            if c_uid:
                                coding_map[c_uid] = c_row
                except Exception as e_code:
                    logger.warning(f"Bulk coding profiles fetch warning: {e_code}")

                for idx, s in enumerate(res_acad.data):
                    uid = s.get("user_id") or f"stu_{idx+1}"
                    full_name = s.get("full_name") or f"Student {idx+1}"
                    dept = s.get("department") or "CSE"
                    sec = s.get("section") or "Section A"
                    year = s.get("academic_year") or "2nd Year"
                    
                    lc_handle = ""
                    gh_handle = ""
                    computed_score = int(s.get("coding_score") or 0)
                    
                    c_row = coding_map.get(uid)
                    if c_row:
                        lc_handle = c_row.get("leetcode_url", "")
                        gh_handle = c_row.get("github_url", "")
                        stats_json = c_row.get("stats_json") or {}
                        score_result = compute_overall_coding_score(stats_json)
                        if score_result.get("overall_score", 0) > 0:
                            computed_score = score_result["overall_score"]

                    att_val = float(s.get("attendance_percentage") or 0.0)
                    roll_num = s.get("roll_number") or f"22TK1A{(dept[:3] if dept else '05').upper()}{str(idx+1).zfill(2)}"
                    supabase_students.append({
                        "id": uid,
                        "name": full_name,
                        "roll_number": roll_num,
                        "section": sec,
                        "department": dept,
                        "year": year,
                        "academic_year": f"Year {year}",
                        "college": s.get("college") or "TKR College of Engineering & Technology",
                        "attendance_percentage": att_val,
                        "coding_score": computed_score,
                        "placement_readiness_score": min(100.0, round((computed_score / 100.0), 1)),
                        "faculty_notes": "",
                        "leetcode_handle": lc_handle,
                        "github_handle": gh_handle,
                        "timeline": [
                            {"date": datetime.now().strftime("%Y-%m-%d"), "title": "Account Registered", "description": "Student joined SkillsCatalyst platform."}
                        ]
                    })
        except Exception as e:
            logger.warning(f"Failed to load Supabase student profiles: {e}")

    # Combine all student profiles
    all_students_map = {**dataset_students_map}
    for stu in supabase_students:
        all_students_map[stu["id"]] = stu

    if all_students_map:
        db_data["students"] = list(all_students_map.values())
    else:
        db_data["students"] = [s for s in db_data.get("students", []) if not str(s.get("id", "")).startswith("STU") and "Student (" not in str(s.get("name", ""))]
    
    _FACULTY_DB_CACHE["data"] = db_data
    _FACULTY_DB_CACHE["timestamp"] = time.time()
    return db_data


def save_db(data: Dict[str, Any]) -> None:
    """Helper to write our mock JSON database."""
    invalidate_faculty_cache()
    try:
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        with open(DB_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving faculty DB: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database write failed: {str(e)}"
        )


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class NoteRequest(BaseModel):
    notes: str = Field(..., min_length=1, description="Faculty remark/notes content")

class AttendanceRecordItem(BaseModel):
    student_id: str
    status: str = Field(..., description="present | absent | late")

class AttendanceSubmission(BaseModel):
    subject: str
    department: str
    year: str
    section: str
    date: str
    records: List[AttendanceRecordItem]

class AssignmentCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str
    subject: str
    year: Optional[str] = None
    department: Optional[str] = None
    section: Optional[str] = None
    deadline: str  # ISO-8601 string
    max_marks: int = Field(..., gt=0)
    attachments: Optional[str] = None

class EvaluationRequest(BaseModel):
    submission_id: int
    marks_obtained: float
    feedback: str

class LearningMaterialCreate(BaseModel):
    title: str = Field(..., min_length=3)
    type: str = Field(..., description="notes | pdf | ppt | link | video | practice_sheet")
    url: str
    subject: str
    semester: str
    department: str
    academic_year: str

class MessageSend(BaseModel):
    receiver_id: str
    content: str = Field(..., min_length=1)
    sender_id: Optional[str] = None
    sender_type: str = Field(default="faculty", description="'student' or 'faculty'")

class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=3)
    content: str
    target_scope: str = Field(..., description="all | department | year | section | subject")
    target_value: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/dashboard")
async def get_dashboard(current_user_id: str = Depends(get_session_or_user_id)):
    """Fetch aggregated statistics and lists for the faculty dashboard homepage."""
    db = load_db()
    
    # 1. Compute quick stats
    students = db.get("students", [])
    assignments = db.get("assignments", [])
    submissions = db.get("submissions", [])
    announcements = db.get("announcements", [])
    
    pending_reviews_count = sum(1 for s in submissions if s.get("status") == "pending")
    low_attendance_count = sum(1 for s in students if s.get("attendance_percentage", 100) < 75.0)
    low_coding_count = sum(1 for s in students if s.get("coding_score", 0) < 400)
    
    # 2. Get recent items
    # Sort submissions by ID/date desc (mocking latest submissions first)
    recent_submissions = submissions[-5:]
    # Attach student names for context
    student_name_map = {s["id"]: s["name"] for s in students}
    assignment_title_map = {a["id"]: a["title"] for a in assignments}
    for sub in recent_submissions:
        sub["student_name"] = student_name_map.get(sub["student_id"], "Unknown Student")
        sub["assignment_title"] = assignment_title_map.get(sub["assignment_id"], "Unknown Assignment")
        
    recent_announcements = announcements[-3:]
    
    # Default recommendations
    ai_recommendations = [
        "Review Alice Johnson's attendance which dropped to 73% (Threshold: 75%). Send automatic alert.",
        "Bob Smith has very low coding activity (Score: 310). Recommend beginners dynamic programming roadmap.",
        "Evaluate 2 pending submissions for the 'Advanced Trees & Graphs Implementation' assignment."
    ]
    
    return {
        "metrics": {
            "pending_reviews": pending_reviews_count,
            "low_attendance_students": low_attendance_count,
            "low_coding_students": low_coding_count,
            "total_students": len(students),
            "total_assignments": len(assignments)
        },
        "classes": db.get("classes", []),
        "recent_submissions": recent_submissions,
        "recent_announcements": recent_announcements,
        "ai_recommendations": ai_recommendations
    }


@router.get("/students")
async def get_students(current_user_id: str = Depends(get_session_or_user_id)):
    """Retrieve all students under faculty supervision."""
    db = load_db()
    return db.get("students", [])


@router.get("/students/{student_id}")
async def get_student_detail(student_id: str, current_user_id: str = Depends(get_session_or_user_id)):
    """Get full student details including coding profiles, questions solved, playlists, roadmaps, and attendance."""
    db = load_db()
    students = db.get("students", [])
    student = next((s for s in students if s["id"] == student_id), None)
    
    sb = get_supabase()
    if not student and sb:
        try:
            res_s = sb.table("user_academic_profile").select("*").eq("user_id", student_id).execute()
            if res_s.data and len(res_s.data) > 0:
                s = res_s.data[0]
                student = {
                    "id": student_id,
                    "name": s.get("full_name", "Student"),
                    "roll_number": s.get("roll_number", "22TK1A0501"),
                    "section": s.get("section", "A"),
                    "department": s.get("department", "CSE"),
                    "year": s.get("academic_year", "2nd Year"),
                    "academic_year": s.get("academic_year", "Year 2"),
                    "college": s.get("college", "TKR College of Engineering & Technology"),
                    "attendance_percentage": float(s.get("attendance_percentage") or 0.0),
                    "coding_score": int(s.get("coding_score") or 0),
                    "placement_readiness_score": 0.0,
                    "faculty_notes": "",
                }
        except Exception:
            pass

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    # Enrich student detail with attendance history
    attendance_records = db.get("attendance_records", [])
    student_attendance_history = [
        r for r in attendance_records if r["student_id"] == student_id
    ]
    student["attendance_history"] = student_attendance_history
    
    # Enrich with assignment history
    submissions = db.get("submissions", [])
    assignments = db.get("assignments", [])
    assignment_map = {a["id"]: a for a in assignments}
    
    student_assignments = []
    for sub in submissions:
        if sub["student_id"] == student_id:
            assign = assignment_map.get(sub["assignment_id"], {})
            student_assignments.append({
                "submission_id": sub["id"],
                "assignment_id": sub["assignment_id"],
                "title": assign.get("title", "Unknown Assignment"),
                "subject": assign.get("subject", ""),
                "max_marks": assign.get("max_marks", 10),
                "marks_obtained": sub.get("marks_obtained", 0),
                "status": sub.get("status", "pending"),
                "submitted_at": sub.get("submitted_at", ""),
                "feedback": sub.get("feedback", "")
            })
    student["assignment_history"] = student_assignments

    # 1. Fetch Coding Profiles & Questions Solved — with formula-based score breakdown
    coding_profiles = {
        "leetcode_url": student.get("leetcode_handle", ""),
        "github_url": student.get("github_handle", ""),
        "total_solved": 0,
        "overall_score": 0,
        "platforms": []
    }
    if sb:
        try:
            import re
            res_code = sb.table("user_coding_profiles").select("*").eq("user_id", student_id).execute()
            if res_code.data and res_code.data[0]:
                c_row = res_code.data[0]
                coding_profiles["leetcode_url"] = c_row.get("leetcode_url") or coding_profiles["leetcode_url"]
                coding_profiles["github_url"] = c_row.get("github_url") or coding_profiles["github_url"]
                stats = c_row.get("stats_json") or {}

                # Compute official score from formulas
                score_result = compute_overall_coding_score(stats)
                coding_profiles["overall_score"] = score_result["overall_score"]
                coding_profiles["total_solved"] = score_result["total_solved"]
                coding_profiles["platforms"] = score_result["platforms"]

                # Update the student object with computed score
                student["coding_score"] = score_result["overall_score"]
        except Exception as e:
            logger.warning(f"Error fetching coding profiles for {student_id}: {e}")

    # 2. Fetch Playlists (Following vs Completed)
    following_playlists = []
    completed_playlists = []
    if sb:
        try:
            res_pl = sb.table("saved_playlists").select("*").eq("user_id", student_id).execute()
            if res_pl.data:
                for pl in res_pl.data:
                    p_info = {
                        "id": pl.get("playlist_id"),
                        "title": pl.get("title", "Untitled Playlist"),
                        "channel": pl.get("channel", ""),
                        "video_count": pl.get("video_count", "?"),
                        "thumbnail": pl.get("thumbnail", "")
                    }
                    following_playlists.append(p_info)
                    
            res_lp = sb.table("learning_progress").select("completed_steps").eq("session_id", student_id).eq("skill_name", "saved_playlists").limit(1).execute()
            if res_lp.data and len(res_lp.data) > 0:
                steps = res_lp.data[0].get("completed_steps", [])
                for step in steps:
                    st_id = step.get("id") or step.get("playlist_id")
                    st_title = step.get("title", "Saved Playlist")
                    v_list = step.get("videos", [])
                    comp_v = [v for v in v_list if v.get("completed") or v.get("watched")]
                    if len(v_list) > 0 and len(comp_v) >= len(v_list):
                        completed_playlists.append({
                            "id": st_id,
                            "title": st_title,
                            "video_count": f"{len(comp_v)}/{len(v_list)}"
                        })
        except Exception as e:
            logger.warning(f"Error fetching playlists info for {student_id}: {e}")

    # 3. Fetch Roadmaps (Following vs Completed)
    following_roadmaps = []
    completed_roadmaps = []
    if sb:
        try:
            from backend.routers.dashboard import ROADMAP_SPECS
            res_rm = sb.table("roadmap_progress").select("roadmap_id, node_id, status").eq("user_id", student_id).execute()
            if res_rm.data:
                groups = {}
                for r in res_rm.data:
                    raw_rid = r.get("roadmap_id")
                    if not raw_rid:
                        continue
                    if raw_rid not in groups:
                        groups[raw_rid] = {"done": 0, "status": r.get("status")}
                    if r.get("status") == "completed" and r.get("node_id") != "_roadmap_started":
                        groups[raw_rid]["done"] += 1

                for rid, ginfo in groups.items():
                    spec = ROADMAP_SPECS.get(rid, {})
                    rm_title = spec.get("name", rid.replace("-", " ").title())
                    total_m = len(spec.get("nodes", [])) or 20
                    pct = min(100, round((ginfo["done"] / total_m) * 100))
                    item = {
                        "roadmap_id": rid,
                        "title": rm_title,
                        "progress_percent": pct,
                        "completed_milestones": ginfo["done"],
                        "total_milestones": total_m
                    }
                    if pct >= 100 or ginfo["status"] == "completed":
                        completed_roadmaps.append(item)
                    else:
                        following_roadmaps.append(item)
        except Exception as e:
            logger.warning(f"Error fetching roadmaps info for {student_id}: {e}")

    student["coding_profiles"] = coding_profiles
    student["playlists_info"] = {
        "following": following_playlists,
        "completed": completed_playlists
    }
    student["roadmaps_info"] = {
        "following": following_roadmaps,
        "completed": completed_roadmaps
    }
    student["attendance_info"] = {
        "percentage": float(student.get("attendance_percentage") or 0.0),
        "status": "Safe (≥75%)" if float(student.get("attendance_percentage") or 0.0) >= 75.0 else "Attention Required (<75%)"
    }
    
    # AI Risk computation
    risk_level = "low"
    risk_reasons = []
    if float(student.get("attendance_percentage") or 0.0) < 75.0:
        risk_level = "high"
        risk_reasons.append("Attendance is below minimum threshold of 75%")
        
    if student.get("coding_score", 0) < 400:
        risk_level = "high" if risk_level == "medium" else "medium"
        risk_reasons.append("Coding activity score is critically low")
        
    student["ai_insights"] = {
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    
    return student


@router.post("/students/{student_id}/notes")
async def update_student_notes(student_id: str, req: NoteRequest, current_user_id: str = Depends(get_session_or_user_id)):
    """Save private faculty remarks/notes for a specific student."""
    db = load_db()
    students = db.get("students", [])
    student = next((s for s in students if s["id"] == student_id), None)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
        
    student["faculty_notes"] = req.notes
    
    # Append to student activity timeline
    timeline_item = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "title": "Faculty Remarks Updated",
        "description": f"Remarks note: '{req.notes[:50]}...'"
    }
    if "timeline" not in student:
        student["timeline"] = []
    student["timeline"].insert(0, timeline_item)
    
    save_db(db)
    return {"success": True, "message": "Faculty notes updated successfully.", "notes": req.notes}


@router.post("/attendance")
async def record_attendance(req: AttendanceSubmission, current_user_id: str = Depends(get_session_or_user_id)):
    """Submit or update bulk attendance logs for a section/subject."""
    db = load_db()
    attendance_records = db.get("attendance_records", [])
    students = db.get("students", [])
    
    # Generate unique ID increment
    next_id = max((r["id"] for r in attendance_records), default=0) + 1
    
    # Insert new record entries or replace duplicates on the same date/subject
    for item in req.records:
        # Check if record already exists for date + subject + student
        existing = next((r for r in attendance_records if r["student_id"] == item.student_id 
                         and r["date"] == req.date and r["subject"] == req.subject), None)
        
        if existing:
            existing["status"] = item.status
        else:
            attendance_records.append({
                "id": next_id,
                "student_id": item.student_id,
                "subject": req.subject,
                "date": req.date,
                "status": item.status
            })
            next_id += 1
            
        # Dynamically adjust student's overall attendance percentage
        # Let's count all records for this student and update
        student = next((s for s in students if s["id"] == item.student_id), None)
        if student:
            all_stu_recs = [r for r in attendance_records if r["student_id"] == item.student_id]
            total_recs = len(all_stu_recs)
            present_recs = sum(1 for r in all_stu_recs if r["status"] in ("present", "late"))
            # Treat late as present for baseline percentage calculation, or slightly adjusted
            student["attendance_percentage"] = round((present_recs / total_recs) * 100, 1) if total_recs > 0 else 100.0

    save_db(db)
    return {"success": True, "message": "Attendance records saved successfully."}


@router.get("/attendance")
async def get_attendance(current_user_id: str = Depends(get_session_or_user_id)):
    """Fetch attendance records database."""
    db = load_db()
    return db.get("attendance_records", [])


@router.post("/assignments")
async def create_assignment(req: AssignmentCreate, current_user_id: str = Depends(get_session_or_user_id)):
    """Publish a new assignment for students."""
    db = load_db()
    assignments = db.get("assignments", [])
    
    next_id = max((a["id"] for a in assignments), default=0) + 1
    
    new_assign = {
        "id": next_id,
        "title": req.title,
        "description": req.description,
        "subject": req.subject,
        "deadline": req.deadline,
        "max_marks": req.max_marks,
        "attachments": req.attachments or "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    assignments.append(new_assign)
    
    # Auto-generate mock pending submissions for active students matching targeted cohort
    submissions = db.get("submissions", [])
    students = db.get("students", [])
    next_sub_id = max((s["id"] for s in submissions), default=0) + 1
    
    # Filter students matching target year, department, and section
    target_students = []
    for student in students:
        s_year = str(student.get("year", ""))
        s_academic_year = str(student.get("academic_year", ""))
        
        year_match = True
        if req.year:
            year_match = (s_year == req.year) or (f"Year {req.year}" in s_academic_year) or (f"{req.year}rd" in s_academic_year) or (f"{req.year}th" in s_academic_year)
            
        dept_match = True
        if req.department:
            dept_match = (student.get("department") == req.department)
            
        sec_match = True
        if req.section:
            sec_match = (student.get("section") == req.section)
            
        if year_match and dept_match and sec_match:
            target_students.append(student)
            
    # If no filters matched, default to all students to prevent empty submissions list
    if not target_students:
        target_students = students
        
    for student in target_students:
        submissions.append({
            "id": next_sub_id,
            "assignment_id": next_id,
            "student_id": student["id"],
            "submitted_at": "",
            "status": "pending",
            "marks_obtained": 0.0,
            "feedback": "",
            "submission_content": ""
        })
        next_sub_id += 1
        
    save_db(db)
    return {"success": True, "assignment": new_assign}


@router.get("/assignments")
async def get_assignments(current_user_id: str = Depends(get_session_or_user_id)):
    """Retrieve list of assignments and all their corresponding student submissions."""
    db = load_db()
    students = db.get("students", [])
    student_name_map = {s["id"]: s["name"] for s in students}
    
    submissions = db.get("submissions", [])
    for sub in submissions:
        sub["student_name"] = student_name_map.get(sub["student_id"], "Unknown Student")
        
    return {
        "assignments": db.get("assignments", []),
        "submissions": submissions
    }


@router.post("/assignments/evaluate")
async def evaluate_submission(req: EvaluationRequest, current_user_id: str = Depends(get_session_or_user_id)):
    """Grade and submit feedback for a student assignment submission."""
    db = load_db()
    submissions = db.get("submissions", [])
    sub = next((s for s in submissions if s["id"] == req.submission_id), None)
    
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
        
    sub["status"] = "graded"
    sub["marks_obtained"] = req.marks_obtained
    sub["feedback"] = req.feedback
    
    # Add timeline event to the student's history
    students = db.get("students", [])
    student = next((s for s in students if s["id"] == sub["student_id"]), None)
    if student:
        timeline_item = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "title": "Assignment Evaluated",
            "description": f"Received {req.marks_obtained} marks on assignment."
        }
        if "timeline" not in student:
            student["timeline"] = []
        student["timeline"].insert(0, timeline_item)
        
    save_db(db)
    return {"success": True, "submission": sub}


@router.post("/learning-materials")
async def upload_learning_material(req: LearningMaterialCreate, current_user_id: str = Depends(get_session_or_user_id)):
    """Upload or register academic lecture notes/videos/pdfs."""
    db = load_db()
    materials = db.get("learning_materials", [])
    
    next_id = max((m["id"] for m in materials), default=0) + 1
    new_material = {
        "id": next_id,
        "title": req.title,
        "type": req.type,
        "url": req.url,
        "subject": req.subject,
        "semester": req.semester,
        "department": req.department,
        "academic_year": req.academic_year,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    materials.append(new_material)
    save_db(db)
    return {"success": True, "material": new_material}


@router.get("/learning-materials")
async def get_learning_materials(current_user_id: str = Depends(get_session_or_user_id)):
    """Fetch all academic learning resources."""
    db = load_db()
    return db.get("learning_materials", [])


@router.get("/messages/{student_id}")
async def get_chat_history(student_id: str, current_user_id: str = Depends(get_session_or_user_id)):
    """Retrieve chat history thread between faculty and a target student from Supabase PostgreSQL."""
    faculty_id = current_user_id or "faculty_demo"
    try:
        messages = messaging_service.get_messages(
            student_id=student_id,
            faculty_id=faculty_id,
        )
        return messages
    except Exception as e:
        logger.error(f"Failed to fetch messages from Supabase: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve messages. Please check Supabase configuration."
        )


@router.post("/messages")
async def send_chat_message(req: MessageSend, current_user_id: str = Depends(get_session_or_user_id)):
    """Send a new direct private message to an assigned student or faculty, persisted in Supabase PostgreSQL."""
    sender_id = req.sender_id if (req.sender_id and req.sender_id.strip()) else (current_user_id or "faculty_demo")
    sender_type = req.sender_type if req.sender_type in ("student", "faculty") else "faculty"

    # Determine student_id and faculty_id from sender/receiver context
    if sender_type == "faculty":
        student_id = req.receiver_id
        faculty_id = sender_id
    else:
        student_id = sender_id
        faculty_id = req.receiver_id

    try:
        new_msg = messaging_service.send_message(
            student_id=student_id,
            faculty_id=faculty_id,
            sender_id=sender_id,
            sender_type=sender_type,
            receiver_id=req.receiver_id,
            content=req.content,
        )
        return new_msg
    except Exception as e:
        logger.error(f"Failed to send message via Supabase: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not send message. Please check Supabase configuration."
        )


@router.post("/announcements")
async def create_announcement(req: AnnouncementCreate, current_user_id: str = Depends(get_session_or_user_id)):
    """Publish a target department/year/section announcement."""
    db = load_db()
    announcements = db.get("announcements", [])
    
    next_id = max((a["id"] for a in announcements), default=0) + 1
    new_ann = {
        "id": next_id,
        "title": req.title,
        "content": req.content,
        "target_scope": req.target_scope,
        "target_value": req.target_value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    announcements.append(new_ann)
    save_db(db)
    return {"success": True, "announcement": new_ann}


@router.get("/announcements")
async def get_announcements(current_user_id: str = Depends(get_session_or_user_id)):
    """Retrieve published announcements list."""
    db = load_db()
    return db.get("announcements", [])


@router.get("/ai-insights")
async def generate_ai_insights(current_user_id: str = Depends(get_session_or_user_id)):
    """
    Trigger Groq/Gemini to scan low performing, declining attendance,
    or low coding student logs and return actionable academic advice.
    """
    db = load_db()
    students = db.get("students", [])
    
    # Gather logs for prompt
    student_logs = []
    for s in students:
        student_logs.append({
            "name": s["name"],
            "attendance": f"{s.get('attendance_percentage', 0.0)}%",
            "coding_score": s.get("coding_score", 0),
            "placement_score": f"{s.get('placement_readiness_score', 0.0)}%",
            "remarks": s.get("faculty_notes", "")
        })
        
    user_prompt = f"""You are an advanced academic AI co-pilot assisting university faculty members.
Below is the performance log of our current engineering students:

{json.dumps(student_logs, indent=2)}

Please evaluate this cohort and return:
1. High-risk students requiring immediate intervention (with concrete reasons like attendance or coding gap).
2. Bulleted, highly actionable recommendations for each risk group.
3. Suggested classroom topics or additional practice sheets to assign.

Respond in clean, production-ready markdown lists suitable for rendering in a dashboard panel. Keep it highly practical and concise.
"""

    try:
        response = chat_with_groq(user_prompt, system_prompt="You are SkillsCatalyst AI Academic Assistant. Provide concise, clear, and actionable feedback.")
        if response and not response.startswith("AI Mentor error:"):
            return {"insights": response}
    except Exception as e:
        logger.warning(f"Groq API call failed or keys not set. Falling back to rule-based insights: {e}")
        
    # Rule-based fallback if LLM is unavailable
    fallback_insights = """### 🚨 High-Risk Students Alert
- **Alice Johnson (CSE-2026-002)**: Attendance is at **73%** (critical threshold is 75%). Although coding score is top-tier (980), she is at risk of academic debarment.
- **Bob Smith (CSE-2026-003)**: Placement readiness score is only **42%** and Coding score is **310**. Significant struggles with fundamental Data Structures.

### 📈 Actionable Recommendations
1. **Attendance Recovery Plan**: Require Alice Johnson to submit a medical certificate or assign extra lab tasks to compensate for missed sessions.
2. **Weekly DSA Bootcamp**: Encourage Bob Smith to enroll in the "Beginners Tree & Graph Search" roadmap.
3. **Structured Mentorship**: Pair Alice (strong coder) with Bob (needs coding guidance) for the upcoming internal hackathon to boost peer learning.
"""
    return {"insights": fallback_insights}


# ── Attendance Reminder n8n Webhook Proxy ────────────────────────────────────
class AttendanceReminderRequest(BaseModel):
    studentName: str
    rollNo: str
    department: Optional[str] = "CSM"
    attendance: float
    email: str


def try_send_direct_email(student_name: str, roll_no: str, attendance: float, to_email: str) -> bool:
    """
    Direct Gmail SMTP email dispatcher fallback if n8n webhook returns 404 or is offline.
    Requires SMTP_EMAIL and SMTP_PASSWORD in .env.
    """
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    if not smtp_email or not smtp_password:
        return False

    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart()
        msg["From"] = f"SkillsCatalyst Faculty <{smtp_email}>"
        msg["To"] = to_email
        msg["Subject"] = "Attendance Reminder - SkillsCatalyst"

        body = f"""Dear {student_name},

📢 Attendance Reminder

Your current attendance is {attendance}%, which is below the minimum required attendance of 75%.

Please attend classes consistently to improve your attendance.

Continued low attendance may lead to detention as per college regulations.

If you have any concerns, please contact your faculty advisor.

Regards,
Faculty
SkillsCatalyst"""

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.send_message(msg)

        logger.info(f"Direct Gmail SMTP email successfully delivered to {to_email}!")
        return True
    except Exception as e:
        logger.error(f"Failed to send direct SMTP email to {to_email}: {e}")
        return False


@router.post("/send-attendance-reminder")
def send_attendance_reminder_webhook(req: AttendanceReminderRequest):
    """
    Proxy endpoint for sending attendance reminder webhook to n8n server-side.
    Prevents browser CORS restrictions ('Failed to fetch').
    """
    n8n_url = (
        os.getenv("NEXT_PUBLIC_N8N_WEBHOOK_URL")
        or os.getenv("N8N_WEBHOOK_URL")
        or "https://shivapatel.app.n8n.cloud/webhook/attendance-alert"
    )

    payload = {
        "studentName": req.studentName,
        "rollNo": req.rollNo,
        "department": req.department,
        "attendance": req.attendance,
        "email": req.email,
    }

    logger.info(f"[n8n Server Proxy] Forwarding attendance reminder for {req.studentName} ({req.rollNo}) to {n8n_url}...")
    console_log_info = f"Webhook URL: {n8n_url} | Payload: {json.dumps(payload)}"
    logger.info(console_log_info)

    # 1. Try sending via n8n Webhook
    try:
        import httpx
        with httpx.Client(timeout=15.0) as client:
            res = client.post(n8n_url, json=payload)
            logger.info(f"[n8n Response] Status: {res.status_code}, Body: {res.text[:300]}")

            if res.status_code in (200, 201, 202):
                return {
                    "success": True,
                    "message": f"Attendance reminder sent successfully to {req.studentName}.",
                    "status_code": res.status_code,
                    "n8n_response": res.text[:300],
                }
            else:
                error_detail = f"n8n Webhook returned HTTP {res.status_code}: {res.text[:250]}"
                logger.error(f"[n8n Error] {error_detail}")
                return {
                    "success": False,
                    "error": error_detail,
                    "status_code": res.status_code,
                }
    except Exception as e:
        logger.warning(f"[n8n Webhook Call Warning] Could not deliver to {n8n_url}: {e}")

    # 2. Try sending via direct SMTP if SMTP credentials exist
    sent_smtp = try_send_direct_email(req.studentName, req.rollNo, req.attendance, req.email)
    if sent_smtp:
        return {
            "success": True,
            "smtp_sent": True,
            "message": f"Attendance reminder email delivered to {req.studentName} ({req.email}) via Direct SMTP.",
        }

    return {
        "success": False,
        "error": f"Failed to connect to n8n webhook at {n8n_url}.",
        "status_code": 500,
    }


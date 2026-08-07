import os
import sys
import json
from pathlib import Path

# Add workspace root to sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pandas as pd
from backend.services.supabase_service import get_supabase_client

EXCEL_PATH = root_dir / "data" / "students" / "skills_catalyst.dataset.xlsx"
JSON_CACHE_PATH = root_dir / "backend" / "data" / "students_db.json"

def calculate_coding_score(leetcode, gfg, codechef, hackerrank, codeforces, gh_repos, gh_commits):
    """Calculate platform coding score."""
    score = (
        (leetcode * 10) +
        (gfg * 8) +
        (codechef * 6) +
        (hackerrank * 2) +
        (codeforces * 12) +
        (gh_repos * 15) +
        (gh_commits * 2)
    )
    return int(score)

def seed_students():
    print(f"Reading dataset from: {EXCEL_PATH}")
    if not EXCEL_PATH.exists():
        print(f"Error: Dataset file not found at {EXCEL_PATH}")
        return False

    df = pd.read_excel(EXCEL_PATH)
    print(f"Loaded {len(df)} student rows.")

    students_list = []
    
    for idx, row in df.iterrows():
        roll_no = str(row.get('Roll No', '')).strip().upper()
        name = str(row.get('Name', '')).strip()
        email = str(row.get('Mail', '')).strip()
        department = str(row.get('Department', '')).strip()
        password = str(row.get('Password', '')).strip() or "Skill@1000"
        
        attendance = float(row.get('Attendance', 0))
        leetcode = int(row.get('LeetCode', 0))
        gfg = int(row.get('GeeksforGeeks', 0))
        codechef = int(row.get('CodeChef', 0))
        hackerrank = int(row.get('HackerRank', 0))
        codeforces = int(row.get('Codeforces', 0))
        gh_repos = int(row.get('GitHub Repos', 0))
        gh_commits = int(row.get('GitHub Commits', 0))
        
        coding_score = calculate_coding_score(
            leetcode, gfg, codechef, hackerrank, codeforces, gh_repos, gh_commits
        )

        student_record = {
            "roll_number": roll_no,
            "full_name": name,
            "email": email,
            "password_hash": password,  # Stored directly as plaintext / hash for student auth
            "department": department,
            "college": "TKR College of Engineering & Technology",
            "attendance": attendance,
            "leetcode_solved": leetcode,
            "gfg_solved": gfg,
            "codechef_solved": codechef,
            "hackerrank_score": hackerrank,
            "codeforces_solved": codeforces,
            "github_repos": gh_repos,
            "github_commits": gh_commits,
            "year": "4",
            "academic_year": "4th Year",
            "section": "Section A",
            "coding_score": coding_score,
            "target_role": "Software Engineer",
        }
        students_list.append(student_record)

    # 1. Save to local JSON backup cache
    JSON_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(JSON_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(students_list, f, indent=2)
    print(f"Saved {len(students_list)} students to local cache: {JSON_CACHE_PATH}")

    # 2. Attempt Supabase Upsert
    supabase = get_supabase_client()
    if supabase:
        try:
            print("Upserting students into Supabase 'public.students' table...")
            res = supabase.table("students").upsert(students_list, on_conflict="roll_number").execute()
            print(f"Successfully upserted {len(students_list)} records into Supabase!")
        except Exception as e:
            print(f"Supabase upsert note: {str(e)}")
            print("Local JSON cache will serve as fallback.")
    else:
        print("Supabase client not initialized. Local JSON cache ready.")

    return True

if __name__ == "__main__":
    seed_students()

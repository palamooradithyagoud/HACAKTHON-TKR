import json
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.services.supabase_service import get_supabase_client

def seed_faculty():
    db_file = root_dir / "backend" / "data" / "faculty_users_db.json"
    with open(db_file, "r", encoding="utf-8") as f:
        faculty_data = json.load(f)

    print(f"Loaded {len(faculty_data)} faculty members from JSON DB:")
    for f in faculty_data:
        print(f" - {f['full_name']} | Designation: {f['designation']} | Email: {f['email']} | Password: {f['password_hash']}")

    supabase = get_supabase_client()
    if supabase:
        try:
            # Prepare format for faculty_users table in Supabase
            supabase_rows = []
            for item in faculty_data:
                supabase_rows.append({
                    "email": item["email"],
                    "password_hash": item["password_hash"],
                    "full_name": item["full_name"],
                    "department": item["department"],
                    "college": item.get("college", "TKR College of Engineering & Technology"),
                })
            res = supabase.table("faculty_users").upsert(supabase_rows, on_conflict="email").execute()
            print("Successfully upserted faculty records into Supabase public.faculty_users!")
        except Exception as e:
            print("Supabase upsert note:", str(e))
    else:
        print("Supabase client not active. Local JSON database is active.")

if __name__ == "__main__":
    seed_faculty()

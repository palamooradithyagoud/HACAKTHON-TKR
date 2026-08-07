import csv
import logging
import os
import sys
from pathlib import Path

# Ensure root directory is in sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from backend.services.supabase_service import get_supabase

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_company_questions")

DATA_DIR = _PROJECT_ROOT / "data" / "leetcode-companywise-interview-questions-master"

PERIOD_FILES = [
    ("all", "all.csv"),
    ("thirty-days", "thirty-days.csv"),
    ("three-months", "three-months.csv"),
    ("six-months", "six-months.csv"),
    ("more-than-six-months", "more-than-six-months.csv"),
]

def parse_csv_file(company_slug: str, period: str, csv_path: Path) -> list[dict]:
    rows = []
    try:
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                raw_id = row.get("ID", "").strip()
                try:
                    q_id = int(raw_id)
                except ValueError:
                    continue

                title = row.get("Title", "").strip()
                if not title:
                    continue

                rows.append({
                    "company_slug": company_slug.lower().strip(),
                    "period": period,
                    "question_id": q_id,
                    "title": title,
                    "url": row.get("URL", "").strip(),
                    "difficulty": row.get("Difficulty", "").strip() or "Easy",
                    "acceptance": row.get("Acceptance %", "").strip(),
                    "frequency": row.get("Frequency %", "").strip(),
                })
    except Exception as e:
        logger.warning(f"Failed to read {csv_path}: {e}")
    return rows

def seed_company_questions():
    sb = get_supabase()
    if not sb:
        logger.error("Supabase client is not available. Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.")
        sys.exit(1)

    if not DATA_DIR.exists():
        logger.error(f"Data directory not found: {DATA_DIR}")
        sys.exit(1)

    companies = [d for d in DATA_DIR.iterdir() if d.is_dir()]
    logger.info(f"Found {len(companies)} company directories in dataset.")

    total_inserted = 0
    total_failed = 0

    batch = []
    BATCH_SIZE = 500

    def push_batch(current_batch):
        nonlocal total_inserted, total_failed
        if not current_batch:
            return
        try:
            sb.table("company_questions").upsert(
                current_batch,
                on_conflict="company_slug,period,question_id"
            ).execute()
            total_inserted += len(current_batch)
        except Exception as err:
            logger.warning(f"Batch upsert warning (size {len(current_batch)}): {err}")
            # Try row by row fallback
            for single in current_batch:
                try:
                    sb.table("company_questions").upsert(
                        single,
                        on_conflict="company_slug,period,question_id"
                    ).execute()
                    total_inserted += 1
                except Exception as s_err:
                    total_failed += 1

    for idx, company_dir in enumerate(sorted(companies, key=lambda d: d.name.lower()), 1):
        company_slug = company_dir.name.lower()
        company_records = 0

        for period, filename in PERIOD_FILES:
            csv_path = company_dir / filename
            if csv_path.exists():
                records = parse_csv_file(company_slug, period, csv_path)
                for rec in records:
                    batch.append(rec)
                    company_records += 1
                    if len(batch) >= BATCH_SIZE:
                        push_batch(batch)
                        batch = []

        if idx % 25 == 0 or idx == len(companies):
            logger.info(f"Progress: [{idx}/{len(companies)}] companies processed. Total questions staged: {total_inserted}")

    if batch:
        push_batch(batch)
        batch = []

    logger.info("=" * 60)
    logger.info(f"SUCCESS: Pushed company-wise interview questions to Supabase!")
    logger.info(f"Total inserted/updated: {total_inserted}")
    logger.info(f"Total failed: {total_failed}")
    logger.info("=" * 60)

if __name__ == "__main__":
    seed_company_questions()

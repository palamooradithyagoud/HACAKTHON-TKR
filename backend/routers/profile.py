import logging
import asyncio
import re
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import httpx
from backend.services.supabase_service import get_supabase
from backend.services.auth_service import get_current_user_id, get_session_or_user_id
from backend.services.score_calculator import compute_overall_coding_score

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["profile"])

# ── Models ────────────────────────────────────────────────--------------------

class AcademicProfileModel(BaseModel):
    # user_id is intentionally excluded — identity comes from verified JWT only
    full_name: str = ""
    college: str = "TKR College of Engineering & Technology"
    department: str = ""
    section: str = ""
    academic_year: str = ""
    target_role: str = ""

class CodingProfilesInputModel(BaseModel):
    # user_id is intentionally excluded — identity comes from verified JWT only
    leetcode: Optional[str] = ""
    github: Optional[str] = ""
    hackerrank: Optional[str] = ""
    codechef: Optional[str] = ""
    geeksforgeeks: Optional[str] = ""
    codeforces: Optional[str] = ""


# ── Extractor Helpers ─────────────────────────────────────────────────────────

def _clean_handle(url_or_handle: Optional[str]) -> str:
    if not url_or_handle:
        return ""
    text = url_or_handle.strip().split("?")[0].split("#")[0].rstrip("/")
    if text.startswith("@"):
        text = text[1:].strip()

    if "leetcode.com" in text or "github.com" in text or "codeforces.com" in text or "codechef.com" in text or "geeksforgeeks.org" in text or "hackerrank.com" in text or "://" in text:
        parts = text.split("/")
        ignored = {
            "http:", "https:", "", "leetcode.com", "www.leetcode.com", "github.com", "www.github.com",
            "codeforces.com", "www.codeforces.com", "codechef.com", "www.codechef.com",
            "geeksforgeeks.org", "www.geeksforgeeks.org", "hackerrank.com", "www.hackerrank.com",
            "u", "profile", "users", "user"
        }
        filtered = [p.strip() for p in parts if p.strip() and p.strip().lower() not in ignored]
        if filtered:
            return filtered[-1]
    return text


async def _extract_leetcode(input_val: str) -> Dict[str, Any]:
    handle = _clean_handle(input_val)
    if not handle:
        return {"configured": False}

    url = "https://leetcode.com/graphql"
    query = """
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
          reputation
        }
      }
    }
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Referer": f"https://leetcode.com/u/{handle}/",
        "Origin": "https://leetcode.com"
    }

    # 1. Try direct LeetCode GraphQL query
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.post(
                url,
                json={"query": query, "variables": {"username": handle}},
                headers=headers
            )
            if resp.status_code == 200:
                data = resp.json().get("data", {}).get("matchedUser")
                if data:
                    stats = data.get("submitStats", {}).get("acSubmissionNum", [])
                    total_solved = easy_solved = medium_solved = hard_solved = 0
                    for s in stats:
                        diff = s.get("difficulty")
                        cnt = s.get("count", 0)
                        if diff == "All":
                            total_solved = cnt
                        elif diff == "Easy":
                            easy_solved = cnt
                        elif diff == "Medium":
                            medium_solved = cnt
                        elif diff == "Hard":
                            hard_solved = cnt

                    ranking = data.get("profile", {}).get("ranking", 0)
                    return {
                        "configured": True,
                        "username": handle,
                        "url": f"https://leetcode.com/u/{handle}",
                        "total_solved": total_solved,
                        "easy_solved": easy_solved,
                        "medium_solved": medium_solved,
                        "hard_solved": hard_solved,
                        "ranking": ranking,
                        "badge": f"{total_solved} Solved",
                        "summary": f"{total_solved} Solved (Easy: {easy_solved}, Med: {medium_solved}, Hard: {hard_solved})"
                    }
    except Exception as e:
        logger.warning(f"Direct LeetCode GraphQL fetch error for {handle}: {e}")

    # 2. Public Fallback APIs
    fallback_urls = [
        f"https://alfa-leetcode-api.onrender.com/userProfile/{handle}",
        f"https://alfa-leetcode-api.onrender.com/{handle}/solved",
    ]
    for fb_url in fallback_urls:
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(fb_url)
                if resp.status_code == 200:
                    data = resp.json()
                    total = data.get("totalSolved") or data.get("solvedProblem") or 0
                    easy = data.get("easySolved", 0)
                    medium = data.get("mediumSolved", 0)
                    hard = data.get("hardSolved", 0)
                    ranking = data.get("ranking", 0)
                    if total > 0 or "totalSolved" in data or "solvedProblem" in data:
                        return {
                            "configured": True,
                            "username": handle,
                            "url": f"https://leetcode.com/u/{handle}",
                            "total_solved": total,
                            "easy_solved": easy,
                            "medium_solved": medium,
                            "hard_solved": hard,
                            "ranking": ranking,
                            "badge": f"{total} Solved",
                            "summary": f"{total} Solved (Easy: {easy}, Med: {medium}, Hard: {hard})"
                        }
        except Exception as e:
            logger.warning(f"LeetCode fallback API error for {handle}: {e}")

    return {
        "configured": True,
        "username": handle,
        "url": f"https://leetcode.com/u/{handle}",
        "badge": "Connected",
        "summary": f"Linked @{handle}"
    }


async def _extract_github(input_val: str) -> Dict[str, Any]:
    handle = _clean_handle(input_val)
    if not handle:
        return {"configured": False}

    url = f"https://api.github.com/users/{handle}"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                data = resp.json()
                repos = data.get("public_repos", 0)
                followers = data.get("followers", 0)

                stars = 0
                repos_resp = await client.get(f"https://api.github.com/users/{handle}/repos?per_page=100", headers={"User-Agent": "Mozilla/5.0"})
                if repos_resp.status_code == 200:
                    repos_list = repos_resp.json()
                    if isinstance(repos_list, list):
                        stars = sum(r.get("stargazers_count", 0) for r in repos_list)

                return {
                    "configured": True,
                    "username": handle,
                    "url": f"https://github.com/{handle}",
                    "public_repos": repos,
                    "followers": followers,
                    "total_stars": stars,
                    "badge": f"{repos} Repos",
                    "summary": f"{repos} Public Repos | {stars} Stars | {followers} Followers"
                }
    except Exception as e:
        logger.warning(f"GitHub fetch error for {handle}: {e}")

    return {
        "configured": True,
        "username": handle,
        "url": f"https://github.com/{handle}",
        "badge": "Connected",
        "summary": f"Linked @{handle}"
    }


async def _extract_codeforces(input_val: str) -> Dict[str, Any]:
    handle = _clean_handle(input_val)
    if not handle:
        return {"configured": False}

    url = f"https://codeforces.com/api/user.info?handles={handle}"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code == 200:
                result = resp.json().get("result", [])
                if result:
                    user_data = result[0]
                    rating = user_data.get("rating", 0)
                    max_rating = user_data.get("maxRating", 0)
                    rank = user_data.get("rank", "unrated")

                    return {
                        "configured": True,
                        "username": handle,
                        "url": f"https://codeforces.com/profile/{handle}",
                        "rating": rating,
                        "max_rating": max_rating,
                        "rank": rank,
                        "badge": f"{rating} Rating",
                        "summary": f"Rating: {rating} ({rank.capitalize()}) | Max: {max_rating}"
                    }
    except Exception as e:
        logger.warning(f"Codeforces fetch error for {handle}: {e}")

    return {
        "configured": True,
        "username": handle,
        "url": f"https://codeforces.com/profile/{handle}",
        "badge": "Connected",
        "summary": f"Linked @{handle}"
    }


async def _extract_codechef(input_val: str) -> Dict[str, Any]:
    handle = _clean_handle(input_val)
    if not handle:
        return {"configured": False}

    url = f"https://www.codechef.com/users/{handle}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                html = resp.text
                rating_match = re.search(r'rating-number.*?>\s*(\d+)\s*<', html)
                stars_match = re.search(r'(\d+★|\d+&#9733;|\d+\s*star)', html, re.IGNORECASE)
                rank_match = re.search(r'global-rank.*?>\s*(\d+)\s*<', html, re.IGNORECASE)

                if rating_match:
                    rating = int(rating_match.group(1))
                    stars = stars_match.group(1).replace("&#9733;", "★") if stars_match else "1★"
                    rank = rank_match.group(1) if rank_match else "N/A"
                    return {
                        "configured": True,
                        "username": handle,
                        "url": url,
                        "rating": rating,
                        "stars": stars,
                        "global_rank": rank,
                        "badge": f"{rating} ({stars})",
                        "summary": f"Rating: {rating} ({stars}) | Rank: #{rank}"
                    }
    except Exception as e:
        logger.warning(f"CodeChef direct scrape error for {handle}: {e}")

    # Fallback to API endpoint
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(f"https://codechef-api.vercel.app/handle/{handle}", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    rating = data.get("currentRating", 0)
                    stars = data.get("stars", "1★")
                    global_rank = data.get("globalRank", 0)
                    return {
                        "configured": True,
                        "username": handle,
                        "url": url,
                        "rating": rating,
                        "stars": stars,
                        "global_rank": global_rank,
                        "badge": f"{stars} ({rating})",
                        "summary": f"Rating: {rating} ({stars}) | Rank: #{global_rank}"
                    }
    except Exception as e:
        logger.warning(f"CodeChef API fetch error for {handle}: {e}")

    return {
        "configured": True,
        "username": handle,
        "url": url,
        "badge": "Connected",
        "summary": f"Linked @{handle}"
    }


async def _extract_gfg(input_val: str) -> Dict[str, Any]:
    handle = _clean_handle(input_val)
    if not handle:
        return {"configured": False}

    url = f"https://www.geeksforgeeks.org/user/{handle}/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    }
    
    # Try public GFG API proxy endpoints first
    api_urls = [
        f"https://geeks-for-geeks-api.vercel.app/user/{handle}",
        f"https://gfg-api.vercel.app/user/{handle}",
    ]
    for api_url in api_urls:
        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(api_url, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    score = data.get("overall_coding_score", 0)
                    solved = data.get("total_problems_solved", 0)
                    if score or solved:
                        return {
                            "configured": True,
                            "username": handle,
                            "url": url,
                            "coding_score": score,
                            "total_solved": solved,
                            "badge": f"{solved} Solved",
                            "summary": f"{solved} Solved | Score: {score}"
                        }
        except Exception:
            pass

    # Direct profile page fetch
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                html = resp.text
                solved_m = re.search(r'total_problems_solved["\']?\s*:\s*(\d+)', html, re.I) or \
                           re.search(r'problems_solved["\']?\s*:\s*(\d+)', html, re.I) or \
                           re.search(r'(\d+)\s*(?:Problems Solved|Solved Problems)', html, re.I)
                score_m = re.search(r'coding_score["\']?\s*:\s*(\d+)', html, re.I) or \
                          re.search(r'(\d+)\s*(?:Coding Score|Overall Score)', html, re.I)
                
                solved = int(solved_m.group(1)) if solved_m else 0
                score = int(score_m.group(1)) if score_m else 0
                if solved or score:
                    return {
                        "configured": True,
                        "username": handle,
                        "url": url,
                        "coding_score": score,
                        "total_solved": solved,
                        "badge": f"{solved} Solved",
                        "summary": f"{solved} Solved | Score: {score}"
                    }
    except Exception as e:
        logger.warning(f"GFG direct fetch error for {handle}: {e}")

    return {
        "configured": True,
        "username": handle,
        "url": url,
        "badge": "Connected",
        "summary": f"Linked @{handle}"
    }


async def _extract_hackerrank(input_val: str) -> Dict[str, Any]:
    handle = _clean_handle(input_val)
    if not handle:
        return {"configured": False}

    return {
        "configured": True,
        "username": handle,
        "url": f"https://www.hackerrank.com/profile/{handle}",
        "badge": "Connected",
        "summary": f"Linked @{handle}"
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def get_profile(user_id: str = Depends(get_session_or_user_id)):
    """
    Fetch current user's Academic Profile and Coding Profiles with extracted stats.
    """
    sb = get_supabase()
    academic_data = {
        "user_id": user_id,
        "full_name": "",
        "college": "TKR College of Engineering & Technology",
        "department": "",
        "section": "",
        "academic_year": "",
        "target_role": "",
    }
    coding_inputs = {
        "leetcode": "",
        "github": "",
        "hackerrank": "",
        "codechef": "",
        "geeksforgeeks": "",
        "codeforces": "",
    }
    coding_stats = {}

    # Check dataset student records
    try:
        from backend.services.student_auth import get_student_by_roll
        student_info = get_student_by_roll(user_id)
        if student_info:
            academic_data["full_name"] = student_info.get("full_name") or academic_data["full_name"]
            academic_data["department"] = student_info.get("department") or academic_data["department"]
            academic_data["roll_number"] = student_info.get("roll_number") or user_id
            academic_data["email"] = student_info.get("email") or f"{user_id.lower()}@tkrec.ac.in"
            academic_data["college"] = student_info.get("college") or "TKR College of Engineering & Technology"
            academic_data["attendance_percentage"] = float(student_info.get("attendance", 0))
            academic_data["coding_score"] = int(student_info.get("coding_score", 0))
            academic_data["target_role"] = student_info.get("target_role") or "Software Engineer"
            academic_data["section"] = student_info.get("section") or "Section A"
            academic_data["academic_year"] = student_info.get("academic_year") or "4th Year"
            
            lc_solved = int(student_info.get("leetcode_solved", 0))
            gfg_solved = int(student_info.get("gfg_solved", 0))
            cc_solved = int(student_info.get("codechef_solved", 0))
            hr_score = int(student_info.get("hackerrank_score", 0))
            cf_solved = int(student_info.get("codeforces_solved", 0))
            gh_repos = int(student_info.get("github_repos", 0))
            gh_commits = int(student_info.get("github_commits", 0))

            dataset_coding_stats = {
                "leetcode": {
                    "configured": True,
                    "username": f"{user_id.lower()}_lc",
                    "total_solved": lc_solved,
                    "badge": f"{lc_solved} Solved",
                    "summary": f"{lc_solved} Problems Solved"
                },
                "geeksforgeeks": {
                    "configured": True,
                    "username": f"{user_id.lower()}_gfg",
                    "total_solved": gfg_solved,
                    "overall_coding_score": gfg_solved * 8,
                    "badge": f"{gfg_solved} Solved",
                    "summary": f"{gfg_solved} Problems Solved"
                },
                "codechef": {
                    "configured": True,
                    "username": f"{user_id.lower()}_cc",
                    "total_solved": cc_solved,
                    "rating": cc_solved * 10,
                    "stars": "3★" if cc_solved > 100 else "2★",
                    "badge": f"{cc_solved} Solved",
                    "summary": f"{cc_solved} Problems Solved"
                },
                "hackerrank": {
                    "configured": True,
                    "username": f"{user_id.lower()}_hr",
                    "score": hr_score,
                    "badge": f"{hr_score} pts",
                    "summary": f"Score: {hr_score} pts"
                },
                "codeforces": {
                    "configured": True,
                    "username": f"{user_id.lower()}_cf",
                    "total_solved": cf_solved,
                    "rating": cf_solved * 12,
                    "badge": f"{cf_solved} Solved",
                    "summary": f"{cf_solved} Problems Solved"
                },
                "github": {
                    "configured": True,
                    "username": f"{user_id.lower()}_gh",
                    "public_repos": gh_repos,
                    "total_commits": gh_commits,
                    "badge": f"{gh_repos} Repos ({gh_commits} Commits)",
                    "summary": f"{gh_repos} Repositories | {gh_commits} Commits"
                }
            }
            if not coding_stats:
                coding_stats = dataset_coding_stats
            else:
                for k, v in dataset_coding_stats.items():
                    if k not in coding_stats or not coding_stats[k].get("configured"):
                        coding_stats[k] = v
    except Exception as e:
        logger.warning(f"Error merging student dataset in profile: {e}")

    return {
        "academic": academic_data,
        "coding_inputs": coding_inputs,
        "coding_stats": coding_stats,
    }



@router.post("/academic")
async def save_academic_profile(
    body: AcademicProfileModel,
    current_user_id: str = Depends(get_session_or_user_id)
):
    """
    Save academic profile info into Supabase.
    """
    user_id = current_user_id  # Always derived from verified JWT — body user_id is ignored
    sb = get_supabase()
    
    data = {
        "user_id": user_id,
        "full_name": body.full_name,
        "college": body.college or "TKR College of Engineering & Technology",
        "department": body.department,
        "section": body.section,
        "academic_year": body.academic_year,
        "target_role": body.target_role,
        # updated_at is auto-managed by Supabase default — do NOT include it
    }

    if sb:
        try:
            result = sb.from_("user_academic_profile").upsert(data, on_conflict="user_id").execute()
            logger.info(f"Academic profile saved: {result.data}")
        except Exception as e:
            logger.error(f"Failed to save academic profile: {e}")

    return {"success": True, "message": "Academic profile saved successfully", "academic": data}


@router.post("/coding")
async def save_coding_profiles(
    body: CodingProfilesInputModel,
    current_user_id: str = Depends(get_session_or_user_id)
):
    """
    Save coding profile URLs/handles, automatically extract live stats from public APIs, and update DB.
    """
    user_id = current_user_id  # Always derived from verified JWT — body user_id is ignored
    
    # Run extractors concurrently
    lc_task = _extract_leetcode(body.leetcode or "")
    gh_task = _extract_github(body.github or "")
    cf_task = _extract_codeforces(body.codeforces or "")
    cc_task = _extract_codechef(body.codechef or "")
    gfg_task = _extract_gfg(body.geeksforgeeks or "")
    hr_task = _extract_hackerrank(body.hackerrank or "")

    lc_stats, gh_stats, cf_stats, cc_stats, gfg_stats, hr_stats = await asyncio.gather(
        lc_task, gh_task, cf_task, cc_task, gfg_task, hr_task
    )

    stats_json = {
        "leetcode": lc_stats,
        "github": gh_stats,
        "codeforces": cf_stats,
        "codechef": cc_stats,
        "geeksforgeeks": gfg_stats,
        "hackerrank": hr_stats,
    }

    db_data = {
        "user_id": user_id,
        "leetcode_url": body.leetcode or "",
        "github_url": body.github or "",
        "hackerrank_url": body.hackerrank or "",
        "codechef_url": body.codechef or "",
        "geeksforgeeks_url": body.geeksforgeeks or "",
        "codeforces_url": body.codeforces or "",
        "stats_json": stats_json,
        # updated_at is auto-managed by Supabase — do NOT include it
    }

    # Compute official platform scores using the defined formulas
    score_result = compute_overall_coding_score(stats_json)
    computed_score = score_result["overall_score"]
    total_solved = score_result["total_solved"]
    platform_breakdown = score_result["platforms"]

    sb = get_supabase()
    if sb:
        try:
            logger.info(f"Saving coding profiles for user_id={user_id}")
            result = sb.from_("user_coding_profiles").upsert(db_data, on_conflict="user_id").execute()
            logger.info(f"Coding profiles saved to Supabase: {len(result.data)} rows")
        except Exception as e:
            logger.error(f"Failed to save coding profiles: {e}")

        # Persist computed score back into user_academic_profile for faculty/dashboard views
        try:
            sb.from_("user_academic_profile").update({"coding_score": computed_score}).eq("user_id", user_id).execute()
            logger.info(f"Updated coding_score={computed_score} for user_id={user_id}")
        except Exception as e:
            logger.warning(f"Could not update coding_score in academic profile: {e}")

    return {
        "success": True,
        "message": "Coding profiles saved and stats extracted successfully",
        "inputs": {
            "leetcode": body.leetcode,
            "github": body.github,
            "hackerrank": body.hackerrank,
            "codechef": body.codechef,
            "geeksforgeeks": body.geeksforgeeks,
            "codeforces": body.codeforces,
        },
        "stats": stats_json,
        "score": {
            "overall_score": computed_score,
            "total_solved": total_solved,
            "platform_breakdown": platform_breakdown,
        },
    }

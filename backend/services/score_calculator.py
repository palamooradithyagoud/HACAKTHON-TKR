import re
from typing import Dict, Any

def compute_overall_coding_score(stats_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes overall score and breakdown for connected coding platforms according to official formula:
    
    Overall Score = Sum of all platform scores
    - HackerRank: Direct score from platform
    - CodeChef: (problems * 2) + ((rating - 1200)^2 / 10) + (contests * 50)
    - CodeForces: (problems * 2) + ((rating - 800)^2 / 10) + (contests * 50)
    - LeetCode: (problems * 10) + ((rating - 1300)^2 / 10) + (contests * 50)
    - InterviewBit: score / 5
    - GeeksforGeeks (GFG): (original_score * 10) + (problems_solved * 5)
    - GitHub: (repos * 15) + (contributions * 5)
    """
    total_overall_score = 0.0
    platform_breakdown = []
    total_problems_solved = 0

    if not stats_json or not isinstance(stats_json, dict):
        return {
            "overall_score": 0,
            "total_solved": 0,
            "platforms": []
        }

    # 1. HackerRank
    hr = stats_json.get("hackerrank") or {}
    if isinstance(hr, dict) and (hr.get("configured") or hr.get("score")):
        direct_score = float(hr.get("score") or hr.get("direct_score") or 0)
        solved = int(hr.get("problems_solved") or hr.get("total_solved") or 0)
        total_problems_solved += solved
        total_overall_score += direct_score
        platform_breakdown.append({
            "name": "HackerRank",
            "score": round(direct_score, 1),
            "solved": solved
        })

    # 2. CodeChef
    cc = stats_json.get("codechef") or {}
    if isinstance(cc, dict) and (cc.get("configured") or cc.get("total_solved") or cc.get("rating")):
        problems = int(cc.get("total_solved") or cc.get("problems_solved") or 0)
        rating = float(cc.get("rating") or 0)
        contests = int(cc.get("contests") or cc.get("contests_count") or 0)
        total_problems_solved += problems

        rating_diff = max(0.0, rating - 1200.0)
        rating_bonus = (rating_diff ** 2) / 10.0
        cc_score = (problems * 2) + rating_bonus + (contests * 50)
        total_overall_score += cc_score
        platform_breakdown.append({
            "name": "CodeChef",
            "score": round(cc_score, 1),
            "solved": problems
        })

    # 3. CodeForces
    cf = stats_json.get("codeforces") or {}
    if isinstance(cf, dict) and (cf.get("configured") or cf.get("total_solved") or cf.get("rating")):
        problems = int(cf.get("total_solved") or cf.get("problems_solved") or 0)
        rating = float(cf.get("rating") or 0)
        contests = int(cf.get("contests") or cf.get("contests_count") or 0)
        total_problems_solved += problems

        rating_diff = max(0.0, rating - 800.0)
        rating_bonus = (rating_diff ** 2) / 10.0
        cf_score = (problems * 2) + rating_bonus + (contests * 50)
        total_overall_score += cf_score
        platform_breakdown.append({
            "name": "CodeForces",
            "score": round(cf_score, 1),
            "solved": problems
        })

    # 4. LeetCode
    lc = stats_json.get("leetcode") or {}
    if isinstance(lc, dict) and (lc.get("configured") or lc.get("total_solved") or lc.get("badge")):
        problems = int(lc.get("total_solved") or lc.get("easy_solved", 0) + lc.get("medium_solved", 0) + lc.get("hard_solved", 0))
        if problems == 0 and lc.get("badge"):
            m = re.search(r"(\d+)", str(lc.get("badge")))
            if m:
                problems = int(m.group(1))
        rating = float(lc.get("rating") or 0)
        contests = int(lc.get("contests") or lc.get("contests_count") or 0)
        total_problems_solved += problems

        rating_diff = max(0.0, rating - 1300.0)
        rating_bonus = (rating_diff ** 2) / 10.0
        lc_score = (problems * 10) + rating_bonus + (contests * 50)
        total_overall_score += lc_score
        platform_breakdown.append({
            "name": "LeetCode",
            "score": round(lc_score, 1),
            "solved": problems
        })

    # 5. InterviewBit
    ib = stats_json.get("interviewbit") or {}
    if isinstance(ib, dict) and (ib.get("configured") or ib.get("score")):
        raw_score = float(ib.get("score") or 0)
        solved = int(ib.get("problems_solved") or ib.get("total_solved") or 0)
        total_problems_solved += solved

        ib_score = raw_score / 5.0
        total_overall_score += ib_score
        platform_breakdown.append({
            "name": "InterviewBit",
            "score": round(ib_score, 1),
            "solved": solved
        })

    # 6. GeeksforGeeks (GFG)
    gfg = stats_json.get("geeksforgeeks") or {}
    if isinstance(gfg, dict) and (gfg.get("configured") or gfg.get("total_solved") or gfg.get("score")):
        orig_score = float(gfg.get("score") or gfg.get("original_score") or 0)
        problems = int(gfg.get("total_solved") or gfg.get("problems_solved") or 0)
        total_problems_solved += problems

        gfg_score = (orig_score * 10) + (problems * 5)
        total_overall_score += gfg_score
        platform_breakdown.append({
            "name": "GeeksforGeeks",
            "score": round(gfg_score, 1),
            "solved": problems
        })

    # 7. GitHub
    gh = stats_json.get("github") or {}
    if isinstance(gh, dict) and (gh.get("configured") or gh.get("repos") or gh.get("contributions")):
        repos = int(gh.get("repos") or gh.get("public_repos") or 0)
        contribs = int(gh.get("contributions") or gh.get("total_contributions") or 0)

        gh_score = (repos * 15) + (contribs * 5)
        total_overall_score += gh_score
        platform_breakdown.append({
            "name": "GitHub",
            "score": round(gh_score, 1),
            "solved": 0
        })

    return {
        "overall_score": int(round(total_overall_score)),
        "total_solved": total_problems_solved,
        "platforms": platform_breakdown
    }

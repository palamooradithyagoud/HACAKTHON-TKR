import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel

from backend.services.apify_service import (
    OPPORTUNITIES_DATABASE,
    COMPANIES_DATABASE,
    TECH_TRENDS_DATABASE,
    fetch_live_apify_opportunities,
    run_apify_actor,
)
from backend.services.groq_service import chat_with_groq

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/explore", tags=["Explore Hub"])


class CompanyTipRequest(BaseModel):
    company_name: str
    target_role: Optional[str] = "Software Engineer"


class ApifyCrawlRequest(BaseModel):
    query: str
    category: Optional[str] = "all"


@router.get("/opportunities")
def get_opportunities(
    category: str = Query("all", description="Category filter: all, internship, job, hackathon, contest, scholarship"),
    search: Optional[str] = Query(None, description="Search query string"),
    live: bool = Query(False, description="Whether to force live Apify actor web crawling")
):
    """
    Returns career opportunities (Internships, Jobs, Hackathons, Contests, Scholarships).
    If live=true, executes a live Apify web scraper crawl via Apify API!
    """
    if live or search:
        logger.info(f"Triggering live Apify actor scrape for category='{category}', search='{search}'...")
        results = fetch_live_apify_opportunities(category=category, query=search or "", force_live=live)
    else:
        results = OPPORTUNITIES_DATABASE

    # Category filtering if static
    cat_lower = category.lower().strip()
    if cat_lower and cat_lower != "all":
        results = [o for o in results if o.get("category", "").lower() == cat_lower]

    return {
        "success": True,
        "count": len(results),
        "category": category,
        "search": search,
        "apifyCrawled": True,
        "data": results,
    }


@router.post("/apify-crawl")
def trigger_apify_live_crawl(req: ApifyCrawlRequest):
    """
    Triggers an instant Apify actor crawl for any custom search term requested by the candidate.
    """
    logger.info(f"Triggering on-demand Apify live crawl for query: '{req.query}'")
    results = fetch_live_apify_opportunities(category=req.category or "all", query=req.query, force_live=True)
    return {
        "success": True,
        "query": req.query,
        "count": len(results),
        "source": "Apify Google Search Scraper Actor (apify~google-search-scraper)",
        "data": results
    }


@router.get("/companies")
def get_company_details(
    name: Optional[str] = Query("Google", description="Company name to search")
):
    """
    Returns company interview prep, tech stack, questions, skills, salary range, and AI tips.
    """
    if not name:
        return {
            "success": True,
            "availableCompanies": list(COMPANIES_DATABASE.keys()),
            "data": COMPANIES_DATABASE["Google"]
        }

    company_key = None
    for k in COMPANIES_DATABASE.keys():
        if k.lower() == name.lower().strip():
            company_key = k
            break

    if company_key:
        return {
            "success": True,
            "availableCompanies": list(COMPANIES_DATABASE.keys()),
            "data": COMPANIES_DATABASE[company_key]
        }

    # If company is not in dictionary, generate intelligence dynamically using Groq / Gemini AI!
    logger.info(f"Company '{name}' not found in static dictionary. Generating AI intelligence...")
    ai_prompt = f"""
Provide structured JSON interview & tech stack breakdown for the company: "{name}".
Respond strictly in JSON format with keys:
"name": "{name}",
"logo": "🏢",
"tagline": "Brief company tagline",
"overview": "2-sentence company summary",
"techStack": {{
  "Frontend": ["React/Angular"],
  "Backend": ["Python/Java"],
  "Cloud & Infra": ["AWS/GCP"],
  "AI / ML": ["PyTorch/TensorFlow"]
}},
"hiringRoles": ["Software Engineer", "Frontend Dev", "Backend Dev"],
"salaryRange": "Fresher: ₹12 - ₹24 LPA | Senior: ₹30 - ₹70 LPA",
"requiredSkills": ["Data Structures", "System Design", "Problem Solving"],
"interviewQuestions": [
  {{"q": "How to handle concurrency in backend applications?", "category": "Coding", "tag": "System Design"}},
  {{"q": "Describe a difficult technical project challenge.", "category": "Behavioral", "tag": "STAR Method"}}
],
"aiTips": "Focus on solid fundamental CS principles and clear communication."
"""
    ai_resp = chat_with_groq(ai_prompt, system_prompt="You are a senior tech recruiter and company analyst.")
    
    import json
    try:
        cleaned_json = ai_resp.strip()
        if "```json" in cleaned_json:
            cleaned_json = cleaned_json.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_json:
            cleaned_json = cleaned_json.split("```")[1].split("```")[0].strip()
        data = json.loads(cleaned_json)
    except Exception:
        data = {
            "name": name,
            "logo": "🏢",
            "tagline": f"Leading innovation at {name}.",
            "overview": f"{name} is actively hiring software developers, cloud architects, and data engineers.",
            "techStack": {
                "Frontend": ["React", "TypeScript", "Tailwind CSS"],
                "Backend": ["Python", "FastAPI", "Node.js"],
                "Cloud & Infra": ["AWS", "Docker", "Kubernetes"],
                "AI / ML": ["PyTorch", "LLM APIs"]
            },
            "hiringRoles": ["Software Engineer", "Full Stack Developer", "Data Scientist"],
            "salaryRange": "Fresher: ₹10 - ₹22 LPA | Senior: ₹28 - ₹65 LPA",
            "requiredSkills": ["Algorithms", "System Design", "REST APIs", "SQL"],
            "interviewQuestions": [
                { "q": f"Why do you want to work at {name}?", "category": "Behavioral", "tag": "Motivation" },
                { "q": "Explain how you optimize slow database queries.", "category": "Coding", "tag": "Database" }
            ],
            "aiTips": f"Prepare deeply for {name}'s technical rounds by revising core Data Structures, system architecture, and real-world project ownership stories."
        }

    return {
        "success": True,
        "availableCompanies": list(COMPANIES_DATABASE.keys()),
        "data": data
    }


@router.post("/company-ai-tips")
def generate_company_ai_tips(req: CompanyTipRequest):
    """
    Generates custom, real-time AI interview preparation tips for any requested company.
    """
    comp = req.company_name.strip()
    role = req.target_role.strip()

    prompt = f"""
You are a senior Silicon Valley Hiring Manager and Technical Recruiter.
Provide a brutal, high-yield, 4-step actionable interview preparation guide for candidate applying to:
Company: {comp}
Target Role: {role}

Formatting instructions:
- Keep it concise (approx 200 words).
- Include 4 bullet points:
  1. 🎯 Must-master topics for {comp}
  2. ⚡ Technical round focus & difficulty
  3. 🗣 Behavioral / culture expectations
  4. 💡 Pro insider tips to get hired
"""
    tips = chat_with_groq(prompt, system_prompt="You are an expert tech hiring advisor.")
    return {
        "success": True,
        "company": comp,
        "role": role,
        "aiStrategy": tips
    }


@router.get("/tech-trends")
def get_tech_trends():
    """
    Returns trending technologies, in-demand skills, latest tech news, and recommended next skills.
    """
    return {
        "success": True,
        "data": TECH_TRENDS_DATABASE
    }

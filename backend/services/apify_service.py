import os
import logging
import httpx
from backend.config import APIFY_API_KEY

logger = logging.getLogger(__name__)

# Fallback API key if not in config
APIFY_TOKEN = APIFY_API_KEY or os.getenv("APIFY_API_KEY", "").strip()

# Global In-Memory Cache for Apify actor crawl outputs
APIFY_CACHE = {
    "opportunities": {},
    "company_insights": {},
}

def fetch_apify_dataset(dataset_id: str) -> list[dict]:
    """
    Fetches items from a completed Apify dataset.
    """
    if not APIFY_TOKEN:
        logger.warning("No APIFY_TOKEN configured.")
        return []

    url = f"https://api.apify.com/v2/datasets/{dataset_id}/items?token={APIFY_TOKEN}"
    try:
        with httpx.Client(timeout=10.0) as client:
            res = client.get(url)
            if res.status_code == 200:
                return res.json()
            else:
                logger.warning(f"Apify dataset fetch HTTP {res.status_code}: {res.text[:150]}")
                return []
    except Exception as e:
        logger.error(f"Error fetching Apify dataset: {e}")
        return []


def run_apify_actor(actor_id: str = "apify~google-search-scraper", run_input: dict = None) -> list[dict]:
    """
    Triggers an Apify actor synchronous run via Apify API and returns dataset items.
    """
    if not APIFY_TOKEN:
        logger.warning("APIFY_TOKEN missing for actor run.")
        return []

    if run_input is None:
        run_input = {
            "queries": "software developer internships jobs hackathons 2026",
            "maxPagesPerQuery": 1,
            "resultsPerPage": 10,
        }

    url = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items?token={APIFY_TOKEN}"
    try:
        logger.info(f"Triggering Apify actor '{actor_id}' with queries='{run_input.get('queries')}'...")
        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, json=run_input)
            if res.status_code in (200, 201):
                items = res.json()
                logger.info(f"Apify actor '{actor_id}' successfully returned {len(items)} items.")
                return items
            else:
                logger.warning(f"Apify actor '{actor_id}' returned HTTP {res.status_code}: {res.text[:200]}")
                return []
    except Exception as e:
        logger.error(f"Apify actor '{actor_id}' execution error: {e}")
        return []


def fetch_live_apify_opportunities(category: str = "all", query: str = "", force_live: bool = False) -> list[dict]:
    """
    Executes a real-time Apify web scraper (apify~google-search-scraper) to fetch live opportunities.
    """
    cache_key = f"{category}_{query}".lower().strip()
    if not force_live and cache_key in APIFY_CACHE["opportunities"]:
        logger.info(f"Returning cached Apify crawled results for '{cache_key}'")
        return APIFY_CACHE["opportunities"][cache_key]

    # Build search query for Apify actor
    search_term = "software engineer developer opportunities 2026 apply"
    if category == "internship":
        search_term = "software engineer developer internships 2026 apply"
    elif category == "job":
        search_term = "software development full time engineer jobs 2026 apply"
    elif category == "hackathon":
        search_term = "global AI software web3 hackathons 2026 devpost"
    elif category == "contest":
        search_term = "competitive programming coding contests 2026 leetcode codeforces"
    elif category == "scholarship":
        search_term = "women in tech computer science scholarships fellowships 2026"

    if query:
        search_term = f"{query} {search_term}"

    run_input = {
        "queries": search_term,
        "maxPagesPerQuery": 1,
        "resultsPerPage": 10,
    }

    actor_items = run_apify_actor("apify~google-search-scraper", run_input)
    scraped_opportunities = []

    if actor_items and isinstance(actor_items, list) and len(actor_items) > 0:
        first = actor_items[0]
        organic = first.get("organicResults", [])
        for idx, item in enumerate(organic[:10]):
            title = item.get("title", "").strip()
            url = item.get("url", "").strip()
            snippet = item.get("description", "").strip()
            disp_url = item.get("displayedUrl", "")
            domain = disp_url.split("/")[0].replace("https://", "").replace("http://", "").replace("www.", "").capitalize()

            if not title or not url:
                continue

            # Skills keyword extraction from text snippet
            skills = []
            skill_keywords = ["Python", "React", "Next.js", "Java", "C++", "FastAPI", "TypeScript", "Node.js", "Docker", "AWS", "SQL", "AI/ML", "DSA", "System Design", "Rust"]
            corpus = f"{title} {snippet}".lower()
            for sk in skill_keywords:
                if sk.lower() in corpus:
                    skills.append(sk)
            if not skills:
                skills = ["Software Engineering", "Full Stack", "Problem Solving"]

            scraped_opportunities.append({
                "id": f"apify-scraped-{idx+1}-{hash(title) % 10000}",
                "title": title,
                "organizer": domain or "Apify Crawled Site",
                "category": category if category != "all" else "job",
                "typeBadge": f"⚡ Apify Scraped: {category.capitalize()}",
                "location": "Global / Remote" if "remote" in corpus else "Worldwide",
                "isRemote": "remote" in corpus,
                "deadline": "2026-09-30",
                "deadlineFormatted": "Live Rolling",
                "status": "⚡ Apify Live Crawled",
                "stipend": "Industry Standard / Grants",
                "skills": skills[:5],
                "applyUrl": url,
                "description": snippet or f"Live scraped web result from {domain} via Apify actor.",
                "isApifyLive": True,
            })

    if scraped_opportunities:
        APIFY_CACHE["opportunities"][cache_key] = scraped_opportunities
        logger.info(f"Apify actor successfully scraped {len(scraped_opportunities)} live opportunities.")
        return scraped_opportunities

    # Fallback to database
    return [o for o in OPPORTUNITIES_DATABASE if category == "all" or o.get("category") == category]


# ── Curated Real-World Opportunity Datasets ──────────────────────────────────
OPPORTUNITIES_DATABASE = [
    {
        "id": "opp-1",
        "title": "Software Development Engineer Intern (Summer 2026)",
        "organizer": "Google",
        "category": "internship",
        "typeBadge": "🎓 Internship",
        "location": "Bengaluru / Hyderabad (Hybrid)",
        "isRemote": False,
        "deadline": "2026-08-30",
        "deadlineFormatted": "Aug 30, 2026",
        "status": "Closing Soon",
        "stipend": "₹1,25,000 / month",
        "skills": ["Data Structures", "Algorithms", "C++ / Java / Python", "System Design"],
        "applyUrl": "https://careers.google.com/jobs/results/",
        "description": "Work alongside Google engineers to build global internet infrastructure and next-gen AI applications."
    },
    {
        "id": "opp-2",
        "title": "Frontend Engineer - React 19 & Next.js",
        "organizer": "Vercel",
        "category": "job",
        "typeBadge": "💼 Full-Time Job",
        "location": "Global Remote",
        "isRemote": True,
        "deadline": "2026-09-15",
        "deadlineFormatted": "Sep 15, 2026",
        "status": "Actively Hiring",
        "stipend": "$120,000 - $160,000 / year",
        "skills": ["Next.js", "React 19", "TypeScript", "Tailwind CSS", "Edge Functions"],
        "applyUrl": "https://vercel.com/careers",
        "description": "Help craft the future of web deployment, edge computing, and frontend frameworks."
    },
    {
        "id": "opp-3",
        "title": "Global AI & Agentic LLM Hackathon 2026",
        "organizer": "Groq & OpenAI",
        "category": "hackathon",
        "typeBadge": "🏆 Hackathon",
        "location": "Online / Global",
        "isRemote": True,
        "deadline": "2026-08-25",
        "deadlineFormatted": "Aug 25, 2026",
        "status": "🔴 Live Now",
        "stipend": "₹25,00,000 Grand Prize Pool",
        "skills": ["Python", "Groq API", "LangChain", "PyTorch", "RAG / VectorDB"],
        "applyUrl": "https://devpost.com/hackathons",
        "description": "Build high-speed real-time AI agents using Groq LPU hardware and win cash prizes, cloud credits, and job offers."
    },
    {
        "id": "opp-4",
        "title": "LeetCode Biweekly Coding Challenge 138",
        "organizer": "LeetCode",
        "category": "contest",
        "typeBadge": "⚡ Coding Contest",
        "location": "Online",
        "isRemote": True,
        "deadline": "2026-08-15",
        "deadlineFormatted": "Aug 15, 2026",
        "status": "Starts this Weekend",
        "stipend": "Top Ranks Get Interview Referrals + Swag",
        "skills": ["Competitive Programming", "DSA", "Problem Solving"],
        "applyUrl": "https://leetcode.com/contest/",
        "description": "Compete against 30,000+ engineers globally in 4 algorithmic challenges within 90 minutes."
    },
    {
        "id": "opp-5",
        "title": "Graduate Women in Tech Fellowship 2026",
        "organizer": "Microsoft Philanthropy",
        "category": "scholarship",
        "typeBadge": "📜 Scholarship",
        "location": "India & SEA Region",
        "isRemote": True,
        "deadline": "2026-10-01",
        "deadlineFormatted": "Oct 01, 2026",
        "status": "Applications Open",
        "stipend": "₹2,00,000 Tuition Grant + Microsoft Mentorship",
        "skills": ["Computer Science", "Leadership", "Academic Excellence"],
        "applyUrl": "https://www.microsoft.com/en-us/research/academic-programs/",
        "description": "Providing financial assistance, 1-on-1 mentorship, and internship fast-track for outstanding women in CS."
    },
    {
        "id": "opp-6",
        "title": "Backend Systems & Cloud Engineer (FastAPI & Rust)",
        "organizer": "Swiggy Tech",
        "category": "job",
        "typeBadge": "💼 Full-Time Job",
        "location": "Bengaluru, KA",
        "isRemote": False,
        "deadline": "2026-09-10",
        "deadlineFormatted": "Sep 10, 2026",
        "status": "Actively Hiring",
        "stipend": "₹18 - ₹28 LPA",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Kafka", "Docker & K8s"],
        "applyUrl": "https://careers.swiggy.com/",
        "description": "Scale real-time delivery routing and microservices serving over 10 million orders daily."
    }
]

# ── Curated Company Interview Intelligence ───────────────────────────────────
COMPANIES_DATABASE = {
    "Google": {
        "name": "Google",
        "logo": "🔍",
        "tagline": "Organizing the world's information and making it universally accessible.",
        "overview": "Google is an engineering-driven powerhouse focusing on search, cloud, AI, Android, and global scale distributed systems.",
        "techStack": {
            "Frontend": ["Angular", "Lit", "TypeScript", "Dart / Flutter"],
            "Backend": ["C++", "Java", "Go", "Python"],
            "Cloud & Infra": ["Google Cloud (GCP)", "Kubernetes (Borg)", "Spanner"],
            "AI / ML": ["TensorFlow", "JAX", "Gemini 2.5 Flash", "TPU Infrastructure"]
        },
        "hiringRoles": ["Software Engineer (SWE I/II)", "Site Reliability Engineer (SRE)", "AI Research Engineer", "Product Manager"],
        "salaryRange": "Fresher: ₹22 - ₹38 LPA | Senior: ₹50 - ₹1.2 Cr",
        "requiredSkills": ["Data Structures & Algorithms", "System Design & Scalability", "Concurrency", "Clean Code & Refactoring"],
        "interviewQuestions": [
            { "q": "Given a binary tree, return its vertical order traversal.", "category": "Coding (Hard)", "tag": "Trees & BFS" },
            { "q": "Design Google Drive / Google Photos backend at 1 Billion user scale.", "category": "System Design", "tag": "Distributed Storage" },
            { "q": "Implement an LRU Cache with O(1) get and put operations.", "category": "Coding (Medium)", "tag": "Data Structures" },
            { "q": "Tell me about a time you had a technical disagreement with a Senior Lead.", "category": "Behavioral", "tag": "Googleyness" }
        ],
        "aiTips": "Google emphasizes deep algorithmic problem-solving with tight time/space complexity analysis. Always communicate your thought process out loud before coding. Practice Googleyness questions on conflict resolution, ownership, and ambiguity."
    },
    "Microsoft": {
        "name": "Microsoft",
        "logo": "🪟",
        "tagline": "Empower every person and every organization on the planet to achieve more.",
        "overview": "Microsoft leads in cloud infrastructure (Azure), enterprise software, AI (OpenAI partnership), Windows, and Developer tools.",
        "techStack": {
            "Frontend": ["React", "TypeScript", "Fluent UI", "Electron"],
            "Backend": ["C# / .NET Core", "C++", "Java", "Python"],
            "Cloud & Infra": ["Microsoft Azure", "CosmosDB", "Azure Kubernetes (AKS)"],
            "AI / ML": ["Azure OpenAI Service", "ONNX", "PyTorch"]
        },
        "hiringRoles": ["Software Engineer (SDE 1/2)", "Cloud Solution Architect", "Security Engineer", "Data Scientist"],
        "salaryRange": "Fresher: ₹18 - ₹32 LPA | Senior: ₹45 - ₹90 LPA",
        "requiredSkills": ["DSA (Arrays, Strings, Dynamic Programming)", "Object-Oriented Design (OOD)", "Azure Cloud", "SQL & Database Indexing"],
        "interviewQuestions": [
            { "q": "Find the median of two sorted arrays in O(log(min(n, m))) time.", "category": "Coding (Hard)", "tag": "Binary Search" },
            { "q": "Design Microsoft Teams chat & notification delivery architecture.", "category": "System Design", "tag": "WebSockets & PubSub" },
            { "q": "Serialize and Deserialize a Binary Tree.", "category": "Coding (Medium)", "tag": "Tree Traversal" }
        ],
        "aiTips": "Focus heavily on solid Object-Oriented Principles (SOLID), clean modular code, and thorough edge case testing during coding rounds."
    },
    "Amazon": {
        "name": "Amazon",
        "logo": "📦",
        "tagline": "Earth's most customer-centric company.",
        "overview": "Amazon dominates e-commerce, cloud computing (AWS), digital streaming, and logistics automation.",
        "techStack": {
            "Frontend": ["React", "TypeScript", "CloudFront"],
            "Backend": ["Java (Spring Boot)", "C++", "Python", "Rust"],
            "Cloud & Infra": ["AWS (EC2, S3, DynamoDB, Lambda, SQS)"],
            "AI / ML": ["AWS Bedrock", "SageMaker", "Neuron"]
        },
        "hiringRoles": ["Software Development Engineer (SDE I/II/III)", "AWS Cloud Engineer", "Solutions Architect"],
        "salaryRange": "Fresher: ₹20 - ₹35 LPA | Senior: ₹48 - ₹1.1 Cr",
        "requiredSkills": ["16 Amazon Leadership Principles", "Object Oriented Design (OOD)", "System Design", "AWS Services"],
        "interviewQuestions": [
            { "q": "Reorganize string such that no two adjacent characters are the same.", "category": "Coding (Medium)", "tag": "Priority Queue" },
            { "q": "Design Amazon Shopping Cart & Flash Sale Checkout System.", "category": "System Design", "tag": "Distributed Transactions" },
            { "q": "Tell me about a time when you had to Customer Obsess and deliver under tight deadlines.", "category": "Behavioral", "tag": "Leadership Principle" }
        ],
        "aiTips": "Amazon interviewers grade behavioral responses directly against the 16 Leadership Principles using the STAR method (Situation, Task, Action, Result). Prepare 2 detailed real-life stories per Leadership Principle!"
    },
    "Meta": {
        "name": "Meta",
        "logo": "♾️",
        "tagline": "Giving people the power to build community and bring the world closer together.",
        "overview": "Meta operates Instagram, WhatsApp, Threads, Facebook, Meta Quest VR, and PyTorch AI ecosystem.",
        "techStack": {
            "Frontend": ["React", "React Native", "Relay", "Flow / TypeScript"],
            "Backend": ["Python (Django)", "C++", "PHP / Hack", "Rust"],
            "Cloud & Infra": ["Internal Distributed Storage (TAO)", "Memcached", "Presto"],
            "AI / ML": ["PyTorch", "LLaMA 3.3", "FAISS Vector DB"]
        },
        "hiringRoles": ["Software Engineer (E3/E4/E5)", "Product Engineer", "ML Systems Engineer"],
        "salaryRange": "Fresher: ₹25 - ₹42 LPA | Senior: ₹60 - ₹1.4 Cr",
        "requiredSkills": ["Ultra-Fast Coding Speed (2 Medium Qs in 45 mins)", "System Design", "PyTorch / ML Infra"],
        "interviewQuestions": [
            { "q": "Merge k sorted linked lists.", "category": "Coding (Hard)", "tag": "Heap / Priority Queue" },
            { "q": "Design Instagram News Feed & Real-time Likes Counter.", "category": "System Design", "tag": "Feed Generation" }
        ],
        "aiTips": "Meta coding rounds demand speed and bug-free precision. You are expected to solve TWO LeetCode Medium/Hard questions cleanly within 45 minutes!"
    },
    "TCS": {
        "name": "TCS (Tata Consultancy Services)",
        "logo": "🏢",
        "tagline": "Building on belief.",
        "overview": "Global IT services, consulting, and business solutions leader serving Fortune 500 enterprises worldwide.",
        "techStack": {
            "Frontend": ["React", "Angular", "HTML5/CSS3"],
            "Backend": ["Java (Spring)", "Python", ".NET Core"],
            "Cloud & Infra": ["AWS", "Azure", "Oracle DB"],
            "AI / ML": ["Python ML", "GenAI Enterprise Solutions"]
        },
        "hiringRoles": ["Ninja Programmer", "Digital Engineer", "Prime Developer"],
        "salaryRange": "Ninja: ₹3.36 - ₹4 LPA | Digital: ₹7 - ₹9 LPA | Prime: ₹9 - ₹11.5 LPA",
        "requiredSkills": ["TCS NQT Aptitude", "Basic C / Java Coding", "DBMS & SQL Queries", "Core OOP Concepts"],
        "interviewQuestions": [
            { "q": "Write a C/Java program to check if a number is an Armstrong number.", "category": "Coding (Basic)", "tag": "Math & Loops" },
            { "q": "What is the difference between INNER JOIN and LEFT JOIN in SQL?", "category": "Database", "tag": "SQL Queries" }
        ],
        "aiTips": "Focus heavily on clearing the TCS NQT Aptitude and Reasoning test first. For technical rounds, revise SQL queries, OOPs fundamentals, and basic C/Java logic."
    }
}

# ── Curated Tech Trends & Market Insights ────────────────────────────────────
TECH_TRENDS_DATABASE = {
    "trendingTech": [
        {
            "id": "tech-1",
            "name": "Agentic AI & LLM Engineering",
            "category": "Artificial Intelligence",
            "marketDemand": 98,
            "demandTag": "🔥 Ultra High Demand",
            "difficulty": "Intermediate - Advanced",
            "growthRate": "+240% YoY",
            "summary": "Building autonomous AI agents using LangChain, AutoGen, CrewAI, Function Calling, and Groq high-speed LPU inference.",
            "recommendedNextSkills": ["Python 3.12", "LangChain / LlamaIndex", "Vector DBs (Chroma/Qdrant)", "FastAPI", "Groq/OpenAI APIs"],
            "salaryBoost": "+45% Premium"
        },
        {
            "id": "tech-2",
            "name": "Next.js 16 & Server Components",
            "category": "Full-Stack Web",
            "marketDemand": 94,
            "demandTag": "⚡ High Industry Adoption",
            "difficulty": "Intermediate",
            "growthRate": "+180% YoY",
            "summary": "Modern React 19 architecture with Server Actions, Turbopack, App Router, Edge Middleware, and Tailwind v4.",
            "recommendedNextSkills": ["TypeScript", "React 19 Hooks", "Tailwind CSS", "Supabase / PostgreSQL", "Vercel Deployment"],
            "salaryBoost": "+30% Premium"
        },
        {
            "id": "tech-3",
            "name": "Rust Systems & Cloud Native",
            "category": "Systems & Infrastructure",
            "marketDemand": 91,
            "demandTag": "🚀 Explosive Growth",
            "difficulty": "Advanced",
            "growthRate": "+150% YoY",
            "summary": "Memory-safe high performance systems programming replacing C/C++ in cloud infrastructure, WebAssembly, and databases.",
            "recommendedNextSkills": ["Rust Ownership & Borrowing", "Tokio Async Engine", "WebAssembly (Wasm)", "Docker & Microservices"],
            "salaryBoost": "+40% Premium"
        },
        {
            "id": "tech-4",
            "name": "Vector Databases & RAG Architecture",
            "category": "AI Infrastructure",
            "marketDemand": 95,
            "demandTag": "🔥 Hot Skill 2026",
            "difficulty": "Intermediate",
            "growthRate": "+210% YoY",
            "summary": "Retrieval-Augmented Generation (RAG), embedding spaces, Semantic Search, and real-time enterprise AI memory.",
            "recommendedNextSkills": ["Pinecone / Qdrant", "Sentence Transformers", "Hybrid Search", "Chunking Strategies"],
            "salaryBoost": "+35% Premium"
        }
    ],
    "inDemandSkills": [
        { "name": "Python & PyTorch", "role": "AI / ML Engineer", "jobsCount": "42,000+ Openings", "avgSalary": "₹16 - ₹35 LPA" },
        { "name": "TypeScript & Next.js", "role": "Full Stack Engineer", "jobsCount": "38,000+ Openings", "avgSalary": "₹12 - ₹28 LPA" },
        { "name": "Docker & Kubernetes", "role": "DevOps & Cloud Engineer", "jobsCount": "29,000+ Openings", "avgSalary": "₹15 - ₹32 LPA" },
        { "name": "System Design & Distributed DBs", "role": "Senior Architect", "jobsCount": "18,000+ Openings", "avgSalary": "₹28 - ₹60 LPA" }
    ],
    "latestTechNews": [
        {
            "id": "news-1",
            "title": "Groq LPU Acceleration Sets New World Record for Real-Time AI Voice & Text Synthesis",
            "source": "TechCrunch",
            "time": "2 Hours Ago",
            "tag": "AI Hardware",
            "url": "https://groq.com/"
        },
        {
            "id": "news-2",
            "title": "React 19 & Next.js 16 Formally Adopted by 80% of Top Tech Startups",
            "source": "Vercel Engineering",
            "time": "5 Hours Ago",
            "tag": "Web Ecosystem",
            "url": "https://nextjs.org/blog"
        },
        {
            "id": "news-3",
            "title": "India's Tech Hiring Rebounds: 150,000+ New Openings for AI & Full-Stack Developers",
            "source": "Economic Times Tech",
            "time": "1 Day Ago",
            "tag": "Career & Hiring",
            "url": "https://economictimes.indiatimes.com/tech"
        }
    ]
}

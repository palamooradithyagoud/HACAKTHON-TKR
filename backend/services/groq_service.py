import logging
import httpx
from groq import Groq
from backend.config import GROQ_API_KEY, GEMINI_API_KEY

logger = logging.getLogger(__name__)

groq_client: Groq | None = None

if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client initialized successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize Groq client: {e}")
else:
    logger.warning("GROQ_API_KEY is not set — Groq AI features will be disabled.")


GROQ_FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "llama3-70b-8192",
]

GEMINI_FALLBACK_MODELS = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemma-4-31b-it",
]

def chat_with_gemini(prompt: str, system_prompt: str) -> str | None:
    """
    Fallback LLM function querying Google Gemini REST API.
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not configured for fallback.")
        return None

    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"System Context: {system_prompt}\n\nUser Request: {prompt}"}]
            }
        ]
    }

    for model_name in GEMINI_FALLBACK_MODELS:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            logger.info(f"Attempting Gemini fallback call to model '{model_name}'.")
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, headers=headers, json=body)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and len(candidates) > 0:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and len(parts) > 0:
                            reply_text = parts[0].get("text", "").strip()
                            if reply_text:
                                logger.info(f"Google Gemini model '{model_name}' fallback succeeded with {len(reply_text)} chars.")
                                return reply_text
                else:
                    logger.warning(f"Gemini model '{model_name}' returned HTTP {res.status_code}: {res.text[:150]}")
        except Exception as err:
            logger.warning(f"Gemini call to '{model_name}' failed: {err}")
            continue

    return None

def chat_with_groq(
    prompt: str,
    system_prompt: str = "You are SkillsCatalyst AI Mentor, an expert career coach and tech interviewer.",
) -> str:
    """
    Sends a prompt to the Groq LLM with automatic model fallback and Google Gemini API fallback on rate limits.
    """
    if groq_client:
        for model_name in GROQ_FALLBACK_MODELS:
            try:
                logger.info(f"Sending prompt to Groq model '{model_name}' (prompt length={len(prompt)} chars).")
                response = groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    model=model_name,
                    temperature=0.6,
                    max_tokens=4096,
                )
                reply = response.choices[0].message.content or "No response from AI."
                logger.info(f"Groq model '{model_name}' succeeded with {len(reply)} chars.")
                return reply
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Groq model '{model_name}' failed: {err_str}")
                if "429" in err_str or "rate_limit" in err_str.lower() or "not found" in err_str.lower():
                    logger.info(f"Rate limit on Groq '{model_name}', trying next model...")
                    continue
                else:
                    continue

    logger.info("Groq models rate-limited or unavailable — activating Google Gemini fallback...")
    gemini_reply = chat_with_gemini(prompt, system_prompt)
    if gemini_reply:
        return gemini_reply

    return "AI Mentor error: Rate limit reached across all AI providers. Please try again shortly."

"""
messaging_service.py
────────────────────
Supabase PostgreSQL-backed messaging data-access layer with JSON file fallback.

Tables (defined in supabase/migrations/003_messages_schema.sql):
  - public.conversations  (one row per student↔faculty pair)
  - public.messages       (individual messages inside a conversation)

If Supabase is unavailable or tables don't exist, falls back to a local
JSON file at backend/data/messages_fallback.json so messages always persist.
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.services.supabase_service import get_supabase

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# JSON Fallback Storage
# ─────────────────────────────────────────────────────────────────────────────

_FALLBACK_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "messages_fallback.json"
)


def _load_fallback() -> Dict[str, Any]:
    try:
        if os.path.exists(_FALLBACK_PATH):
            with open(_FALLBACK_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warning("Could not read messages fallback file: %s", e)
    return {"conversations": [], "messages": []}


def _save_fallback(data: Dict[str, Any]) -> None:
    try:
        os.makedirs(os.path.dirname(_FALLBACK_PATH), exist_ok=True)
        with open(_FALLBACK_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error("Could not write messages fallback file: %s", e)


def _fallback_get_or_create_conversation(student_id: str, faculty_id: str) -> Dict[str, Any]:
    data = _load_fallback()
    for conv in data["conversations"]:
        if conv["student_id"] == student_id and conv["faculty_id"] == faculty_id:
            return conv
    new_conv = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "faculty_id": faculty_id,
        "last_message": "",
        "last_message_time": _now_iso(),
        "unread_student_count": 0,
        "unread_faculty_count": 0,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    data["conversations"].append(new_conv)
    _save_fallback(data)
    return new_conv


def _fallback_send_message(*, student_id, faculty_id, sender_id, sender_type, receiver_id, content) -> Dict[str, Any]:
    data = _load_fallback()
    conv = _fallback_get_or_create_conversation(student_id, faculty_id)
    conv_id = conv["id"]
    new_msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": sender_id,
        "sender_type": sender_type,
        "receiver_id": receiver_id,
        "content": content,
        "is_read": False,
        "deleted": False,
        "created_at": _now_iso(),
    }
    # Re-load to avoid stale data
    data = _load_fallback()
    data["messages"].append(new_msg)
    for c in data["conversations"]:
        if c["id"] == conv_id:
            c["last_message"] = content[:200]
            c["last_message_time"] = _now_iso()
            c["updated_at"] = _now_iso()
            if sender_type == "faculty":
                c["unread_student_count"] = c.get("unread_student_count", 0) + 1
            else:
                c["unread_faculty_count"] = c.get("unread_faculty_count", 0) + 1
            break
    _save_fallback(data)
    logger.info("Fallback: Message saved | conv=%s | from=%s (%s)", conv_id, sender_id, sender_type)
    return new_msg


def _fallback_get_messages_by_student(student_id: str) -> List[Dict[str, Any]]:
    data = _load_fallback()
    conv_ids = {c["id"] for c in data["conversations"] if c["student_id"] == student_id}
    messages = [m for m in data["messages"] if m["conversation_id"] in conv_ids and not m.get("deleted", False)]
    messages.sort(key=lambda m: m.get("created_at", ""))
    logger.info("Fallback: Fetched %d messages for student_id=%s", len(messages), student_id)
    return messages


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_supabase_safe():
    try:
        return get_supabase()
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Conversations
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_conversation(student_id: str, faculty_id: str) -> Dict[str, Any]:
    """
    Return the existing conversation row for a student-faculty pair,
    or create a new one. Falls back to local JSON if Supabase fails.
    """
    sb = _get_supabase_safe()
    if sb is None:
        return _fallback_get_or_create_conversation(student_id, faculty_id)
    try:
        result = sb.table("conversations").select("*").eq("student_id", student_id).eq("faculty_id", faculty_id).limit(1).execute()
        if result.data:
            return result.data[0]
        insert_result = sb.table("conversations").insert({
            "student_id": student_id,
            "faculty_id": faculty_id,
            "last_message": "",
            "last_message_time": _now_iso(),
            "unread_student_count": 0,
            "unread_faculty_count": 0,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
        }).execute()
        if not insert_result.data:
            raise RuntimeError("Insert returned no data")
        return insert_result.data[0]
    except Exception as e:
        logger.warning("Supabase conversation lookup failed (%s). Using local JSON fallback.", e)
        return _fallback_get_or_create_conversation(student_id, faculty_id)


# ─────────────────────────────────────────────────────────────────────────────
# Send a message
# ─────────────────────────────────────────────────────────────────────────────

def send_message(
    *,
    student_id: str,
    faculty_id: str,
    sender_id: str,
    sender_type: str,   # "student" | "faculty"
    receiver_id: str,
    content: str,
) -> Dict[str, Any]:
    """
    Insert a new message. Falls back to local JSON store if Supabase fails.
    Returns the newly created message row dict.
    """
    sb = _get_supabase_safe()
    if sb is None:
        return _fallback_send_message(
            student_id=student_id, faculty_id=faculty_id, sender_id=sender_id,
            sender_type=sender_type, receiver_id=receiver_id, content=content,
        )
    try:
        conversation = get_or_create_conversation(student_id, faculty_id)
        conv_id = conversation["id"]
        now = _now_iso()
        msg_result = sb.table("messages").insert({
            "conversation_id": conv_id,
            "sender_id": sender_id,
            "sender_type": sender_type,
            "receiver_id": receiver_id,
            "content": content,
            "is_read": False,
            "deleted": False,
            "created_at": now,
        }).execute()
        if not msg_result.data:
            raise RuntimeError("Failed to insert message into Supabase")
        new_msg = msg_result.data[0]
        unread_field = "unread_student_count" if sender_type == "faculty" else "unread_faculty_count"
        current_unread = conversation.get(unread_field, 0) or 0
        sb.table("conversations").update({
            "last_message": content[:200],
            "last_message_time": now,
            "updated_at": now,
            unread_field: current_unread + 1,
        }).eq("id", conv_id).execute()
        logger.info("Message sent | conv_id=%s | from=%s (%s) | to=%s", conv_id, sender_id, sender_type, receiver_id)
        return new_msg
    except Exception as e:
        logger.warning("Supabase send_message failed (%s). Using local JSON fallback.", e)
        return _fallback_send_message(
            student_id=student_id, faculty_id=faculty_id, sender_id=sender_id,
            sender_type=sender_type, receiver_id=receiver_id, content=content,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Fetch messages
# ─────────────────────────────────────────────────────────────────────────────

def get_messages(student_id: str, faculty_id: str) -> list:
    """
    Return all non-deleted messages for a student-faculty conversation.
    """
    return get_messages_by_student(student_id)


def get_messages_by_student(student_id: str) -> List[Dict[str, Any]]:
    """
    Return all non-deleted messages where the student is involved,
    ordered oldest to newest. Falls back to local JSON if Supabase fails.
    """
    sb = _get_supabase_safe()
    if sb is None:
        return _fallback_get_messages_by_student(student_id)
    try:
        conv_result = sb.table("conversations").select("id").eq("student_id", student_id).execute()
        if not conv_result.data:
            # Also check local fallback for any locally-stored messages
            return _fallback_get_messages_by_student(student_id)
        conv_ids = [row["id"] for row in conv_result.data]
        msgs_result = (
            sb.table("messages")
            .select("*")
            .in_("conversation_id", conv_ids)
            .eq("deleted", False)
            .order("created_at", desc=False)
            .execute()
        )
        messages = msgs_result.data or []
        unread_ids = [m["id"] for m in messages if m.get("sender_type") == "student" and not m.get("is_read", False)]
        if unread_ids:
            sb.table("messages").update({"is_read": True}).in_("id", unread_ids).execute()
            sb.table("conversations").update({"unread_faculty_count": 0, "updated_at": _now_iso()}).in_("id", conv_ids).execute()
        logger.info("Fetched %d messages for student_id=%s", len(messages), student_id)
        return messages
    except Exception as e:
        logger.warning("Supabase get_messages failed (%s). Using local JSON fallback.", e)
        return _fallback_get_messages_by_student(student_id)


# ─────────────────────────────────────────────────────────────────────────────
# Conversation list (all students a faculty has messaged)
# ─────────────────────────────────────────────────────────────────────────────

def get_faculty_conversations(faculty_id: str) -> List[Dict[str, Any]]:
    """Return all conversation rows for a faculty member, newest first."""
    sb = _get_supabase_safe()
    if sb is None:
        data = _load_fallback()
        convs = [c for c in data["conversations"] if c["faculty_id"] == faculty_id]
        convs.sort(key=lambda c: c.get("updated_at", ""), reverse=True)
        return convs
    try:
        result = sb.table("conversations").select("*").eq("faculty_id", faculty_id).order("updated_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        logger.warning("Supabase get_faculty_conversations failed (%s). Using local JSON fallback.", e)
        data = _load_fallback()
        convs = [c for c in data["conversations"] if c["faculty_id"] == faculty_id]
        convs.sort(key=lambda c: c.get("updated_at", ""), reverse=True)
        return convs

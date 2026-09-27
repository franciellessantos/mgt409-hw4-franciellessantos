"""Append-only audit trail for agent-loop activity.

Every agent run appends events (tool calls, tool results, run end / errors) to
`output/audit_trail.json` as one JSON object per line (JSON Lines). The file is
only ever appended to — past interactions are never edited or deleted.
"""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

AUDIT_PATH = Path(__file__).resolve().parent.parent / "output" / "audit_trail.json"
_LOCK = threading.Lock()
_MAX = 300  # truncate long args/results so the log stays readable


def _short(value: Any) -> Any:
    try:
        text = value if isinstance(value, str) else json.dumps(value, default=str)
    except (TypeError, ValueError):
        text = str(value)
    return text if len(text) <= _MAX else text[:_MAX] + "…"


def append_event(event: dict) -> None:
    """Append one event (with an ISO-8601 UTC timestamp) to the audit trail."""
    record = {"time": datetime.now(timezone.utc).isoformat(), **event}
    line = json.dumps(record, ensure_ascii=False, default=str)
    with _LOCK:
        AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with AUDIT_PATH.open("a", encoding="utf-8") as f:
            f.write(line + "\n")


def log_run(messages: list, stop_reason: str, user_id: int | None, question: str) -> None:
    """Record a full agent run: the user's question, each tool call and its
    result, and why the loop stopped. `messages` is result.all_messages()."""
    append_event(
        {
            "event": "run_start",
            "user_id": user_id,
            "question": _short(question),
        }
    )
    for msg in messages:
        for part in getattr(msg, "parts", []):
            kind = getattr(part, "part_kind", type(part).__name__)
            if kind in ("tool-call", "ToolCallPart"):
                append_event(
                    {
                        "event": "tool_call",
                        "tool": getattr(part, "tool_name", "?"),
                        "args": _short(getattr(part, "args", "")),
                    }
                )
            elif kind in ("tool-return", "ToolReturnPart"):
                append_event(
                    {
                        "event": "tool_result",
                        "tool": getattr(part, "tool_name", "?"),
                        "result": _short(getattr(part, "content", "")),
                    }
                )
    append_event({"event": "run_end", "stop_reason": stop_reason})

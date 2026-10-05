"""
ai.py - Communication layer for local Ollama + Gemma 3 1B
Sends a structured prompt to the local Ollama endpoint, then validates and
normalises the JSON response so the rest of SAMJHO always receives clean data.
"""

import json
import re
from typing import Any, Dict, List

import requests

from prompts import (
    SYSTEM_INSTRUCTION,
    build_document_analysis_prompt,
    build_hindi_explanation_prompt,
)

DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "gemma3:1b"

# Context window. Ollama's default is small, so long documents would be silently
# cut off (and a deadline on a later page would never reach the model).
DEFAULT_NUM_CTX = 8192
ANALYSIS_TIMEOUT = 240  # seconds - a 1B model on a CPU laptop can be slow
HINDI_TIMEOUT = 120

NOT_SPECIFIED = "Not specified"

# Output contract. Ollama (recent versions) can enforce this schema directly.
ANALYSIS_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "document_type": {"type": "string"},
        "summary": {"type": "string"},
        "actions": {"type": "array", "items": {"type": "string"}},
        "deadline": {"type": "string"},
        "cost": {"type": "string"},
        "important_points": {"type": "array", "items": {"type": "string"}},
        "evidence": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "claim": {"type": "string"},
                    "page": {"type": "integer"},
                    "quote": {"type": "string"},
                },
                "required": ["claim", "page", "quote"],
            },
        },
    },
    "required": [
        "document_type",
        "summary",
        "actions",
        "deadline",
        "cost",
        "important_points",
        "evidence",
    ],
}


class SAMJHOAIError(Exception):
    pass


# --------------------------------------------------------------------------- #
# Ollama status
# --------------------------------------------------------------------------- #
def check_ollama_status(
    base_url: str = DEFAULT_OLLAMA_URL, model: str = DEFAULT_MODEL
) -> Dict[str, Any]:
    """
    Checks if Ollama is running, lists installed models, and whether `model` is installed.
    Returns: {"available": bool, "models": [...], "model_ready": bool}
    """
    try:
        res = requests.get(f"{base_url}/api/tags", timeout=2)
        if res.status_code == 200:
            models = [m.get("name") for m in res.json().get("models", []) if m.get("name")]
            wanted = model if ":" in model else f"{model}:latest"
            model_ready = wanted in models or model in models
            return {"available": True, "models": models, "model_ready": model_ready}
        return {"available": False, "models": [], "model_ready": False}
    except Exception:
        return {"available": False, "models": [], "model_ready": False}


# --------------------------------------------------------------------------- #
# JSON parsing + normalisation
# --------------------------------------------------------------------------- #
def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """
    Parses a JSON object from the model response, stripping markdown fences if present.
    Always returns a dict or raises SAMJHOAIError (never a raw JSONDecodeError).
    """
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    parsed: Any = None
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start != -1 and end > start:
            try:
                parsed = json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                parsed = None

    if not isinstance(parsed, dict):
        raise SAMJHOAIError("Gemma response was not valid JSON.")
    return parsed


def _as_text(value: Any, default: str = "") -> str:
    """Turns any model value into a clean string; empty/null-like values become `default`."""
    if value is None:
        return default
    if isinstance(value, (list, tuple)):
        value = "; ".join(str(v).strip() for v in value if str(v).strip())
    text = str(value).strip()
    if text.lower() in {"", "null", "none", "n/a", "na", "not mentioned", "unknown"}:
        return default
    return text


def _as_str_list(value: Any) -> List[str]:
    """Turns a string / list / None into a list of non-empty strings."""
    if value is None:
        return []
    if isinstance(value, str):
        parts = [p.strip(" -•\t") for p in re.split(r"\n|;", value)]
        return [p for p in parts if p]
    if isinstance(value, (list, tuple)):
        return [str(v).strip() for v in value if str(v).strip()]
    return [str(value).strip()]


def _as_page(value: Any) -> int:
    try:
        return max(int(value), 0)
    except (TypeError, ValueError):
        return 0


def normalize_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Forces the model output into the SAMJHO output contract with correct types.
    Missing deadline/cost become "Not specified" - nothing is ever invented.
    """
    evidence: List[Dict[str, Any]] = []
    raw_evidence = data.get("evidence")
    if isinstance(raw_evidence, list):
        for item in raw_evidence:
            if not isinstance(item, dict):
                continue
            quote = _as_text(item.get("quote"))
            if not quote:
                continue  # evidence without a quote cannot be verified
            evidence.append(
                {
                    "claim": _as_text(item.get("claim")),
                    "page": _as_page(item.get("page")),
                    "quote": quote,
                }
            )

    return {
        "document_type": _as_text(data.get("document_type"), "Unknown document"),
        "summary": _as_text(data.get("summary")),
        "actions": _as_str_list(data.get("actions")),
        "deadline": _as_text(data.get("deadline"), NOT_SPECIFIED),
        "cost": _as_text(data.get("cost"), NOT_SPECIFIED),
        "important_points": _as_str_list(data.get("important_points")),
        "evidence": evidence,
    }


# --------------------------------------------------------------------------- #
# Ollama calls
# --------------------------------------------------------------------------- #
def _generate(payload: Dict[str, Any], base_url: str, model: str, timeout: int) -> requests.Response:
    """POSTs to Ollama /api/generate and converts connection problems into SAMJHOAIError."""
    try:
        return requests.post(f"{base_url}/api/generate", json=payload, timeout=timeout)
    except requests.exceptions.ConnectionError:
        raise SAMJHOAIError(
            f"Could not connect to Ollama at {base_url}. "
            f"Please start Ollama and make sure the model is installed (`ollama pull {model}`)."
        )
    except requests.exceptions.Timeout:
        raise SAMJHOAIError(
            f"Inference timed out. {model} took longer than {timeout} seconds to respond."
        )


def analyze_document_with_gemma(
    pages: list[dict],
    base_url: str = DEFAULT_OLLAMA_URL,
    model: str = DEFAULT_MODEL,
    num_ctx: int = DEFAULT_NUM_CTX,
) -> Dict[str, Any]:
    """
    Executes local inference with Gemma via the Ollama API.
    Returns a validated dictionary matching the SAMJHO output contract.
    """
    prompt = build_document_analysis_prompt(pages)

    payload = {
        "model": model,
        "system": SYSTEM_INSTRUCTION,
        "prompt": prompt,
        "format": ANALYSIS_SCHEMA,  # enforce the schema (older Ollama: falls back below)
        "stream": False,
        "options": {
            "temperature": 0.1,  # strict, factual extraction
            "num_predict": 2048,
            "num_ctx": num_ctx,
        },
    }

    res = _generate(payload, base_url, model, ANALYSIS_TIMEOUT)

    # Older Ollama versions only accept format="json" - retry once with that.
    if res.status_code == 400 and isinstance(payload["format"], dict):
        payload["format"] = "json"
        res = _generate(payload, base_url, model, ANALYSIS_TIMEOUT)

    if res.status_code == 404:
        raise SAMJHOAIError(
            f"Model '{model}' was not found in Ollama. Run `ollama pull {model}` and try again."
        )
    if res.status_code != 200:
        raise SAMJHOAIError(f"Ollama API returned HTTP {res.status_code}: {res.text}")

    try:
        response_text = res.json().get("response", "")
    except ValueError:
        raise SAMJHOAIError("Ollama returned an unreadable response.")
    if not response_text:
        raise SAMJHOAIError("Ollama returned an empty response.")

    return normalize_analysis(clean_json_response(response_text))


def generate_hindi_explanation(
    analysis_data: Dict[str, Any],
    base_url: str = DEFAULT_OLLAMA_URL,
    model: str = DEFAULT_MODEL,
    num_ctx: int = DEFAULT_NUM_CTX,
) -> str:
    """
    Requests a conversational Hindi / Hinglish breakdown of already-extracted facts.
    Raises SAMJHOAIError on failure (the UI should show the error, not display it as the explanation).
    """
    prompt = build_hindi_explanation_prompt(analysis_data)

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 1024,
            "num_ctx": num_ctx,
        },
    }

    res = _generate(payload, base_url, model, HINDI_TIMEOUT)
    if res.status_code != 200:
        raise SAMJHOAIError(f"Hindi explanation failed (Ollama HTTP {res.status_code}).")

    try:
        text = res.json().get("response", "").strip()
    except ValueError:
        raise SAMJHOAIError("Ollama returned an unreadable Hindi response.")
    if not text:
        raise SAMJHOAIError("Ollama returned an empty Hindi explanation.")
    return text

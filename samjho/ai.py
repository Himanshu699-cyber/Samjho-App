"""
ai.py - Communication layer for local Ollama + Gemma 3 1B
Sends structured prompt to local Ollama endpoint and validates JSON response.
"""

import json
import re
from typing import Dict, Any, Optional
import requests
from prompts import SYSTEM_INSTRUCTION, build_document_analysis_prompt, build_hindi_explanation_prompt

DEFAULT_OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "gemma3:1b"

class SAMJHOAIError(Exception):
    pass

def check_ollama_status(base_url: str = DEFAULT_OLLAMA_URL) -> Dict[str, Any]:
    """
    Checks if Ollama is running and lists installed models.
    """
    try:
        res = requests.get(f"{base_url}/api/tags", timeout=2)
        if res.status_code == 200:
            models = [m.get("name") for m in res.json().get("models", [])]
            return {"available": True, "models": models}
        return {"available": False, "models": []}
    except Exception:
        return {"available": False, "models": []}


def clean_json_response(raw_text: str) -> Dict[str, Any]:
    """
    Parses JSON from model response, stripping any surrounding markdown fences if present.
    """
    # Remove markdown codeblocks ```json ... ```
    cleaned = re.sub(r'^```json\s*', '', raw_text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*```$', '', cleaned.strip())

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: attempt to find first '{' and last '}'
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1:
            return json.loads(cleaned[start:end+1])
        raise SAMJHOAIError("Gemma response was not valid JSON.")


def analyze_document_with_gemma(
    pages: list[dict],
    base_url: str = DEFAULT_OLLAMA_URL,
    model: str = DEFAULT_MODEL
) -> Dict[str, Any]:
    """
    Executes local inference with Gemma via Ollama API.
    Returns structured dictionary matching the SAMJHO output contract.
    """
    prompt = build_document_analysis_prompt(pages)

    payload = {
        "model": model,
        "prompt": f"{SYSTEM_INSTRUCTION}\n\n{prompt}",
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1,  # Strict factual grounded extraction
            "num_predict": 2048
        }
    }

    try:
        res = requests.post(f"{base_url}/api/generate", json=payload, timeout=90)
    except requests.exceptions.ConnectionError:
        raise SAMJHOAIError(
            f"Could not connect to Ollama at {base_url}. Please ensure Ollama is running (`ollama run {model}`)."
        )
    except requests.exceptions.Timeout:
        raise SAMJHOAIError("Inference timed out. Gemma 3 1B took longer than 90 seconds to respond.")

    if res.status_code != 200:
        raise SAMJHOAIError(f"Ollama API returned HTTP {res.status_code}: {res.text}")

    response_text = res.json().get("response", "")
    if not response_text:
        raise SAMJHOAIError("Ollama returned an empty response.")

    data = clean_json_response(response_text)

    # Validate mandatory schema contract fields
    expected_fields = ["document_type", "summary", "actions", "deadline", "cost", "important_points"]
    for field in expected_fields:
        if field not in data:
            data[field] = "Not specified" if field in ["deadline", "cost"] else []

    if "evidence" not in data or not isinstance(data["evidence"], list):
        data["evidence"] = []

    return data


def generate_hindi_explanation(
    analysis_data: Dict[str, Any],
    base_url: str = DEFAULT_OLLAMA_URL,
    model: str = DEFAULT_MODEL
) -> str:
    """
    Requests a conversational Hindi / Hinglish breakdown of already-extracted facts.
    """
    prompt = build_hindi_explanation_prompt(analysis_data)

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 1024
        }
    }

    try:
        res = requests.post(f"{base_url}/api/generate", json=payload, timeout=60)
        if res.status_code == 200:
            return res.json().get("response", "").strip()
        return "क्षमा करें, हिंदी स्पष्टीकरण तैयार नहीं हो सका।"
    except Exception as e:
        return f"हिंदी स्पष्टीकरण में त्रुटि: {str(e)}"

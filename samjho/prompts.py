"""
prompts.py - Prompt generator and schema definitions for SAMJHO
"""

SYSTEM_INSTRUCTION = """You are SAMJHO, an offline AI document understanding assistant.
Your goal is to explain complicated institutional documents (college notices, scholarships, bank letters, government paperwork) in simple, accessible language.

CRITICAL RULES:
1. Do not invent missing information.
2. If a deadline is not specified in the document, return "Not specified".
3. If cost/fee is not specified in the document, return "Not specified".
4. For every important claim (such as deadline, cost, major action, or critical requirement), provide the exact page number and verbatim supporting quote from the document in the 'evidence' list.
5. If an item cannot be directly quoted, do not invent a fake quote.
6. Return valid JSON only, conforming strictly to the requested schema. Do not include markdown code fence formatting outside the JSON."""

def build_document_analysis_prompt(pages: list[dict]) -> str:
    """
    Constructs the prompt containing page-aware document text and instructions.
    """
    formatted_pages = []
    for p in pages:
        formatted_pages.append(f"--- PAGE {p.get('page', 1)} ---\n{p.get('text', '')}")
    document_text = "\n\n".join(formatted_pages)

    prompt = f"""Analyze the following document and output structured JSON:

DOCUMENT:
{document_text}

JSON SCHEMA CONTRACT:
{{
  "document_type": "Brief classification (e.g. Scholarship Verification Notice, Bank KYC Warning)",
  "summary": "Clear, plain English explanation of what this document is about (2-3 sentences)",
  "actions": [
    "Clear action step 1 that the user must take",
    "Action step 2"
  ],
  "deadline": "Exact deadline string or 'Not specified'",
  "cost": "Exact fee/cost amount or 'Not specified'",
  "important_points": [
    "Key requirement or condition",
    "Consequence if ignored"
  ],
  "evidence": [
    {{
      "claim": "Deadline: 15 October 2026",
      "page": 1,
      "quote": "Exact verbatim quote from the text supporting this claim"
    }},
    {{
      "claim": "Cost: No fee required",
      "page": 2,
      "quote": "Exact verbatim quote regarding fee"
    }}
  ]
}}
"""
    return prompt


def build_hindi_explanation_prompt(analysis_data: dict) -> str:
    """
    Constructs a prompt to generate a friendly Hindi / Hinglish explanation of already-extracted facts.
    Ensures zero new facts are introduced.
    """
    summary = analysis_data.get("summary", "")
    actions = "\n".join([f"- {a}" for a in analysis_data.get("actions", [])])
    deadline = analysis_data.get("deadline", "Not specified")
    cost = analysis_data.get("cost", "Not specified")
    important_points = "\n".join([f"- {p}" for p in analysis_data.get("important_points", [])])

    prompt = f"""You are SAMJHO explaining a document to a friend in simple, conversational Hindi / Hinglish.
Explain the following already-verified facts clearly and empathetically (like a friend explaining: "Bhai, ye notice bol raha hai ki...").
Do NOT invent any new facts or deadlines not listed below.

DOCUMENT TYPE: {analysis_data.get('document_type', '')}
SUMMARY: {summary}
ACTIONS REQUIRED:
{actions}
DEADLINE: {deadline}
COST: {cost}
IMPORTANT POINTS:
{important_points}

Provide:
1. Hindi Summary (सरल हिंदी में समझाइए)
2. Hinglish Summary (Bhai style explanation)
3. Step-by-step Actions in Hindi (Aapko kya karna hai)
"""
    return prompt

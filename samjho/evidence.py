"""
evidence.py - Evidence verification engine for SAMJHO
Checks AI claims and quotes against original extracted document pages.
"""

import re
from typing import List, Dict, Any, Optional

def clean_text(s: str) -> str:
    """Normalize text for whitespace and punctuation-insensitive matching."""
    if not s:
        return ""
    # Lowercase, replace non-alphanumeric with spaces, collapse spaces
    s = s.lower()
    s = re.sub(r'[^\w\s]', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def _locate_quote(
    claim: str,
    quote: str,
    target_page: Optional[int],
    document_pages: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Finds a quote in the original document pages (existence check only).
    Returns status: 'Verified' or 'Unverified' with match confidence and snippet.
    """
    if not quote or len(quote.strip()) == 0:
        return {
            "claim": claim,
            "quote": quote,
            "page": target_page or 1,
            "status": "Unverified",
            "verified": False,
            "confidence": 0,
            "matched_page": None,
            "snippet": None,
            "reason": "No quote provided by AI model."
        }

    clean_quote = clean_text(quote)
    if len(clean_quote) < 4:
        return {
            "claim": claim,
            "quote": quote,
            "page": target_page or 1,
            "status": "Unverified",
            "verified": False,
            "confidence": 0,
            "matched_page": None,
            "snippet": None,
            "reason": "Quote too short to verify reliably."
        }

    # First check specified target page if provided
    pages_to_check = document_pages.copy()
    if target_page and 1 <= target_page <= len(document_pages):
        # Prioritize checking the target page first
        target_idx = target_page - 1
        pages_to_check = [document_pages[target_idx]] + [
            p for idx, p in enumerate(document_pages) if idx != target_idx
        ]

    for p in pages_to_check:
        page_num = p.get("page", 1)
        raw_text = p.get("text", "")
        page_clean = clean_text(raw_text)

        # 1. Exact raw match (case insensitive)
        if quote.lower().strip() in raw_text.lower():
            idx = raw_text.lower().find(quote.lower().strip())
            start = max(0, idx - 50)
            end = min(len(raw_text), idx + len(quote) + 50)
            snippet = raw_text[start:end].replace("\n", " ").strip()
            return {
                "claim": claim,
                "quote": quote,
                "page": page_num,
                "status": "Verified",
                "verified": True,
                "confidence": 100,
                "matched_page": page_num,
                "snippet": f"...{snippet}...",
                "reason": f"Exact verbatim match found on Page {page_num}."
            }

        # 2. Normalized text match
        if clean_quote in page_clean:
            idx = page_clean.find(clean_quote)
            start = max(0, idx - 40)
            end = min(len(page_clean), idx + len(clean_quote) + 40)
            return {
                "claim": claim,
                "quote": quote,
                "page": page_num,
                "status": "Verified",
                "verified": True,
                "confidence": 95,
                "matched_page": page_num,
                "snippet": f"...{page_clean[start:end]}...",
                "reason": f"Normalized text match found on Page {page_num}."
            }

        # 3. Key phrase token matching
        words = clean_quote.split()
        if len(words) >= 4:
            first_chunk = " ".join(words[:4])
            last_chunk = " ".join(words[-4:])
            if first_chunk in page_clean and last_chunk in page_clean:
                return {
                    "claim": claim,
                    "quote": quote,
                    "page": page_num,
                    "status": "Verified",
                    "verified": True,
                    "confidence": 85,
                    "matched_page": page_num,
                    "snippet": f"...[Matched key phrases on Page {page_num}]...",
                    "reason": f"Key phrases confirmed on Page {page_num}."
                }

    # If quote not found anywhere in document
    return {
        "claim": claim,
        "quote": quote,
        "page": target_page or 1,
        "status": "Unverified",
        "verified": False,
        "confidence": 0,
        "matched_page": None,
        "snippet": None,
        "reason": "⚠ SAMJHO couldn't verify this claim against the document text."
    }


def _digit_tokens(s: str) -> set:
    """Numbers/dates/IDs in a string, normalised: '5,000' -> '5000', '03' -> '3'."""
    s = re.sub(r'(?<=\d),(?=\d)', '', s or "")
    return {t.lstrip('0') or '0' for t in re.findall(r'\d+', s)}


def verify_single_evidence(
    claim: str,
    quote: str,
    target_page: Optional[int],
    document_pages: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Two-step check:
      1. Does the quote really exist in the document?  (_locate_quote)
      2. Does the quote actually support the claim?     (every number / date / ID in the
         claim must also appear in the quote)
    A real quote that does not contain the claimed value is marked Unverified, so the
    model cannot "prove" a claim by attaching an unrelated sentence from the document.
    """
    result = _locate_quote(claim, quote, target_page, document_pages)
    if not result["verified"]:
        return result

    missing = sorted(_digit_tokens(claim) - _digit_tokens(quote))
    if missing:
        result.update({
            "status": "Unverified",
            "verified": False,
            "confidence": 0,
            "reason": (
                "⚠ The quote exists in the document, but it does not contain "
                f"{', '.join(missing)} from the claim."
            ),
        })
    return result


def validate_all_evidence(
    evidence_list: List[Dict[str, Any]],
    document_pages: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Validates a list of evidence claims generated by the AI against original document pages.
    """
    validated_results = []
    for item in evidence_list:
        claim = item.get("claim", "")
        quote = item.get("quote", "")
        page = item.get("page", 1)
        res = verify_single_evidence(claim, quote, page, document_pages)
        validated_results.append(res)
    return validated_results

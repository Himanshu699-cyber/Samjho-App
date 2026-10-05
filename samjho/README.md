# SAMJHO (समझो)

> **Tagline:** *Don’t just translate. Understand.*  
> **Challenge:** Hacktoberfest Weekend Challenge — Build for a Friend  
> **Architecture:** Offline, Privacy-First AI Document Understanding Assistant  
> **Model:** Gemma 3 1B via Ollama  

---

## 1. Problem Statement

Every week, students and family members receive confusing college circulars, scholarship renewal notices, bank KYC letters, electricity disconnection warnings, and government forms. They ask:

> *“Bhai, ye document kya bol raha hai?”*

Traditional translators only translate the complex legal English into complex Hindi without answering the real human questions:
- **What is this?**
- **What do I need to do?**
- **When is the deadline?**
- **How much will it cost?**
- **Where did you get this information? (PROVE IT)**

SAMJHO is designed to eliminate this dependency with 100% offline, privacy-first processing.

---

## 2. Core Features

1. **Local-First Privacy:** Documents remain on the user's laptop. Zero cloud AI API transmission.
2. **PyMuPDF + Tesseract OCR Pipeline:** Direct text extraction for digital PDFs; automatic OCR fallback for scanned images and mobile camera snapshots.
3. **Structured Output Contract:** Gemma 3 1B returns structured JSON rather than uncontrolled hallucinations.
4. **PROVE IT (Main Differentiating Feature):** Quotes and page numbers are cross-referenced with character-level fuzzy search against original text (`✓ Verified` or `⚠ Unverified`).
5. **Zero Hallucination:** If no deadline or fee is mentioned, SAMJHO explicitly states `"Not specified"` rather than inventing dates.
6. **Explain in Hindi / Hinglish:** Conversational breakdown (*"Bhai, ye notice bol raha hai ki..."*) based strictly on already-verified facts.

---

## 3. High-Level Architecture

```
User uploads document
        ↓
Document Parser (parser.py)
        ↓
Text extraction OR Tesseract OCR
        ↓
Page-wise extracted text
        ↓
Prompt Generator (prompts.py)
        ↓
Ollama + Gemma 3 1B (ai.py)
        ↓
Structured JSON
        ↓
Evidence Validator (evidence.py)
        ↓
Streamlit UI (app.py) / Web Interface
```

---

## 4. Setup & Installation (Python / Streamlit)

### Prerequisites
- Python 3.12
- [Ollama](https://ollama.com/) installed
- Tesseract OCR (`sudo apt install tesseract-ocr` on Linux / `brew install tesseract` on Mac)

### Quick Start

1. **Pull the local model:**
   ```bash
   ollama run gemma3:1b
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch SAMJHO:**
   ```bash
   streamlit run app.py
   ```

---

## 5. Structured Output Contract

```json
{
  "document_type": "Scholarship Notice",
  "summary": "This notice explains the mandatory physical document submission.",
  "actions": [
    "Fill out scholarship verification proforma",
    "Attach Tahsildar income certificate",
    "Submit at Room 204 Administrative Block"
  ],
  "deadline": "15 October 2026",
  "cost": "No fee mentioned",
  "important_points": [
    "Late submissions forfeit scholarship eligibility"
  ],
  "evidence": [
    {
      "claim": "Deadline: 15 October 2026",
      "page": 1,
      "quote": "The final cutoff date for physical document verification is 15 October 2026."
    }
  ]
}
```

import React, { useState } from 'react';
import { X, Code2, Terminal, Copy, Check, Download, FileText } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'app' | 'ai' | 'parser' | 'evidence' | 'prompts' | 'requirements'>('app');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files: Record<string, { filename: string; language: string; content: string }> = {
    app: {
      filename: 'app.py',
      language: 'python',
      content: `# app.py - Streamlit Interface for SAMJHO
import streamlit as st
import time
from parser import extract_text_from_pdf, extract_text_from_image
from ai import analyze_document_with_gemma, generate_hindi_explanation, check_ollama_status
from evidence import validate_all_evidence

st.set_page_config(page_title="SAMJHO", page_icon="📄", layout="wide")
st.title("SAMJHO — Don't just translate. Understand.")

uploaded_file = st.file_uploader("Upload PDF or Scan", type=["pdf", "png", "jpg"])
if uploaded_file and st.button("🚀 Understand Document"):
    bytes_data = uploaded_file.read()
    pages, full_text, used_ocr = extract_text_from_pdf(bytes_data)
    result = analyze_document_with_gemma(pages)
    result["validated_evidence"] = validate_all_evidence(result.get("evidence", []), pages)
    
    st.subheader("1. WHAT IS THIS?")
    st.write(result.get("summary"))
    
    st.subheader("2. WHAT DO I NEED TO DO?")
    for a in result.get("actions", []):
        st.checkbox(a)
        
    st.subheader("3. DEADLINE & 4. COST")
    st.write(f"Deadline: {result.get('deadline')}")
    st.write(f"Cost: {result.get('cost')}")
    
    st.subheader("5. PROVE IT")
    for ev in result.get("validated_evidence", []):
        st.write(f"Claim: {ev.get('claim')} — {ev.get('status')} on Page {ev.get('page')}")
        st.caption(ev.get('quote'))
`
    },
    ai: {
      filename: 'ai.py',
      language: 'python',
      content: `# ai.py - Ollama + Gemma 3 1B Communication
import requests
import json
from prompts import SYSTEM_INSTRUCTION, build_document_analysis_prompt

def analyze_document_with_gemma(pages, base_url="http://localhost:11434", model="gemma3:1b"):
    prompt = build_document_analysis_prompt(pages)
    payload = {
        "model": model,
        "prompt": f"{SYSTEM_INSTRUCTION}\\n\\n{prompt}",
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.1}
    }
    res = requests.post(f"{base_url}/api/generate", json=payload, timeout=90)
    return json.loads(res.json().get("response", "{}"))
`
    },
    parser: {
      filename: 'parser.py',
      language: 'python',
      content: `# parser.py - PyMuPDF & Tesseract OCR Pipeline
import fitz
import io
from PIL import Image
import pytesseract

def extract_text_from_pdf(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages = []
    total_text = ""
    for idx, page in enumerate(doc):
        t = page.get_text("text") or ""
        total_text += t
        pages.append({"page": idx + 1, "text": t})
        
    # Check if scanned
    if len(total_text.strip()) / max(1, len(doc)) < 35:
        # OCR fallback
        ocr_pages = []
        for idx, page in enumerate(doc):
            pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            ocr_text = pytesseract.image_to_string(img)
            ocr_pages.append({"page": idx + 1, "text": ocr_text})
        return ocr_pages, "\\n".join([p["text"] for p in ocr_pages]), True
        
    return pages, total_text, False
`
    },
    evidence: {
      filename: 'evidence.py',
      language: 'python',
      content: `# evidence.py - Zero-Trust Evidence Validation
import re

def verify_single_evidence(claim, quote, target_page, document_pages):
    clean_quote = re.sub(r'\\s+', ' ', quote.lower().strip())
    for p in document_pages:
        page_clean = re.sub(r'\\s+', ' ', p.get("text", "").lower())
        if clean_quote in page_clean:
            return {
                "claim": claim,
                "quote": quote,
                "page": p.get("page", 1),
                "status": "Verified",
                "verified": True,
                "confidence": 100
            }
    return {
        "claim": claim,
        "quote": quote,
        "page": target_page,
        "status": "Unverified",
        "verified": False,
        "confidence": 0
    }
`
    },
    prompts: {
      filename: 'prompts.py',
      language: 'python',
      content: `# prompts.py - Prompt Engineering & Contract Schema
SYSTEM_INSTRUCTION = """You are SAMJHO. Output valid JSON matching contract:
{
  "document_type": "",
  "summary": "",
  "actions": [],
  "deadline": "Not specified",
  "cost": "Not specified",
  "important_points": [],
  "evidence": [{"claim": "", "page": 1, "quote": ""}]
}"""
`
    },
    requirements: {
      filename: 'requirements.txt',
      language: 'text',
      content: `streamlit>=1.38.0
pymupdf>=1.24.0
pytesseract>=0.3.10
Pillow>=10.4.0
requests>=2.32.0
`
    }
  };

  const currentFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Python Streamlit Offline Architecture
              </h3>
              <p className="text-xs text-slate-500">
                TDD Section 17 & 18 — Pure offline setup with PyMuPDF, Tesseract & Ollama Gemma 3 1B
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-2 overflow-x-auto bg-slate-100/60 text-xs">
          {Object.entries(files).map(([key, f]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-3 py-2 font-mono font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === key
                  ? 'border-orange-600 bg-white text-orange-700 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.filename}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 p-5 bg-slate-950 text-slate-100 overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed relative">
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </>
            )}
          </button>
          <pre>{currentFile.content}</pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>Run locally: <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">ollama run gemma3:1b &amp;&amp; streamlit run samjho/app.py</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

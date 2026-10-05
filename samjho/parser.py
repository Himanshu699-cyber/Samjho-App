"""
parser.py - PDF text extraction and OCR engine for SAMJHO
Uses PyMuPDF for digital text and Tesseract for scanned image-based PDFs.
"""

import io
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

def is_text_useful(text: str, num_pages: int) -> bool:
    """
    Determines if direct text extraction yielded usable content.
    Returns False if total characters per page are very low (indicating scanned images).
    """
    total_chars = len(text.strip())
    if num_pages == 0:
        return False
    avg_chars = total_chars / num_pages
    return avg_chars >= 35

def extract_text_from_pdf(
    file_bytes: bytes,
    ocr_lang: str = "eng"
) -> Tuple[List[Dict[str, Any]], str, bool]:
    """
    Extracts text page-by-page from a PDF file buffer.
    Returns:
      (pages, full_text, was_ocr_used)
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    num_pages = len(doc)
    extracted_pages: List[Dict[str, Any]] = []
    total_direct_text = ""

    # First pass: try PyMuPDF direct text extraction
    for page_idx in range(num_pages):
        page = doc[page_idx]
        text = page.get_text("text") or ""
        total_direct_text += text
        extracted_pages.append({
            "page": page_idx + 1,
            "text": text
        })

    # Check if text is useful
    if is_text_useful(total_direct_text, num_pages):
        full_text = "\n\n".join([f"--- PAGE {p['page']} ---\n{p['text']}" for p in extracted_pages])
        return extracted_pages, full_text, False

    # Second pass: Scanned document detected -> Use Tesseract OCR
    ocr_pages: List[Dict[str, Any]] = []
    for page_idx in range(num_pages):
        page = doc[page_idx]
        # Render page to pixmap at 2.0 scale (144 DPI) for OCR accuracy
        zoom = 2.0
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))

        # Run Tesseract OCR
        ocr_text = pytesseract.image_to_string(img, lang=ocr_lang) or ""
        ocr_pages.append({
            "page": page_idx + 1,
            "text": ocr_text
        })

    full_text = "\n\n".join([f"--- PAGE {p['page']} ---\n{p['text']}" for p in ocr_pages])
    return ocr_pages, full_text, True

def extract_text_from_image(image_bytes: bytes, ocr_lang: str = "eng") -> Tuple[List[Dict[str, Any]], str, bool]:
    """
    Performs OCR directly on an uploaded image file (PNG/JPG).
    """
    img = Image.open(io.BytesIO(image_bytes))
    ocr_text = pytesseract.image_to_string(img, lang=ocr_lang) or ""
    pages = [{"page": 1, "text": ocr_text}]
    return pages, ocr_text, True

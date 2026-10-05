"""
app.py - Streamlit Interface for SAMJHO
Offline AI Document Understanding Assistant
"""

import streamlit as st
import time
from parser import extract_text_from_pdf, extract_text_from_image
from ai import analyze_document_with_gemma, generate_hindi_explanation, check_ollama_status, SAMJHOAIError
from evidence import validate_all_evidence

st.set_page_config(
    page_title="SAMJHO — Don't just translate. Understand.",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.4rem;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 0.2rem;
    }
    .sub-tagline {
        font-size: 1.15rem;
        font-style: italic;
        color: #ea580c;
        margin-bottom: 1.5rem;
    }
    .card-box {
        background: #ffffff;
        padding: 1.25rem 1.5rem;
        border-radius: 1rem;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        margin-bottom: 1rem;
    }
    .card-title {
        font-size: 0.85rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #475569;
        margin-bottom: 0.5rem;
    }
    .verified-badge {
        display: inline-block;
        background-color: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        padding: 0.2rem 0.6rem;
        border-radius: 0.5rem;
        font-weight: 700;
        font-size: 0.8rem;
    }
    .unverified-badge {
        display: inline-block;
        background-color: #fffbeb;
        color: #92400e;
        border: 1px solid #fde68a;
        padding: 0.2rem 0.6rem;
        border-radius: 0.5rem;
        font-weight: 700;
        font-size: 0.8rem;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar: System Status & Privacy Guarantee
with st.sidebar:
    st.title("⚙️ SAMJHO Settings")
    st.markdown("**Local-first Privacy Architecture**")
    st.info("🔒 All documents remain strictly on your local machine. No cloud API or external servers used.")

    ollama_url = st.text_input("Ollama Base URL", value="http://localhost:11434")
    model_name = st.text_input("Model Name", value="gemma3:1b")

    ollama_check = check_ollama_status(ollama_url)
    if ollama_check["available"]:
        st.success(f"✓ Ollama Online ({len(ollama_check['models'])} models available)")
    else:
        st.warning("⚠ Ollama not responding on port 11434. Run `ollama run gemma3:1b` in terminal.")

    st.markdown("---")
    st.markdown("### Hacktoberfest 2026")
    st.caption("Challenge: Build for a Friend\nFocus: Explain official notices in simple language.")

# Main Screen Header
st.markdown('<div class="main-header">SAMJHO (समझो)</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-tagline">“Don’t just translate. Understand.”</div>', unsafe_allow_html=True)

st.markdown("""
Upload confusing college circulars, scholarship forms, government orders, or bank letters.
SAMJHO tells you **what it means**, **what to do**, **deadline**, **cost**, and **proves every claim**.
""")

# File Uploader
uploaded_file = st.file_uploader(
    "Choose a PDF or scanned image document",
    type=["pdf", "png", "jpg", "jpeg"]
)

# Session state initialization
if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None
if "document_pages" not in st.session_state:
    st.session_state.document_pages = []
if "hindi_explanation" not in st.session_state:
    st.session_state.hindi_explanation = None

if uploaded_file is not None and st.button("🚀 Understand Document", type="primary"):
    st.session_state.hindi_explanation = None
    file_bytes = uploaded_file.read()

    # Progress Stepper as defined in TDD Section 14
    progress_placeholder = st.empty()

    with progress_placeholder.container():
        st.write("### SAMJHO is reading your document...")
        step1 = st.empty()
        step2 = st.empty()
        step3 = st.empty()
        step4 = st.empty()
        step5 = st.empty()

        step1.markdown("⏳ Reading document...")
        time.sleep(0.3)
        step1.markdown("✓ **Reading document**")

        step2.markdown("⏳ Extracting text (PDF / OCR)...")
        if uploaded_file.name.lower().endswith(".pdf"):
            pages, full_text, used_ocr = extract_text_from_pdf(file_bytes)
        else:
            pages, full_text, used_ocr = extract_text_from_image(file_bytes)

        ocr_label = " (via Tesseract OCR)" if used_ocr else " (Direct Text)"
        step2.markdown(f"✓ **Extracting text**{ocr_label}")
        st.session_state.document_pages = pages

        step3.markdown("⏳ Finding important information with Gemma 3 1B...")
        try:
            raw_analysis = analyze_document_with_gemma(pages, base_url=ollama_url, model=model_name)
            step3.markdown("✓ **Finding important information**")
        except SAMJHOAIError as e:
            step3.markdown(f"❌ Error with Gemma: {str(e)}")
            st.error(f"AI Failure: {str(e)}")
            st.stop()

        step4.markdown("⏳ Checking evidence against original document...")
        validated_evidence = validate_all_evidence(raw_analysis.get("evidence", []), pages)
        raw_analysis["validated_evidence"] = validated_evidence
        step4.markdown("✓ **Checking evidence**")

        step5.markdown("⏳ Preparing explanation...")
        time.sleep(0.2)
        step5.markdown("✓ **Preparing explanation**")
        time.sleep(0.4)

    progress_placeholder.empty()
    st.session_state.analysis_result = raw_analysis

# Render Results
if st.session_state.analysis_result:
    res = st.session_state.analysis_result
    pages = st.session_state.document_pages

    st.markdown("---")

    # 1. WHAT IS THIS?
    st.markdown(f"""
    <div class="card-box" style="border-left: 6px solid #ea580c;">
        <div class="card-title">1. WHAT IS THIS? ({res.get('document_type', 'Notice')})</div>
        <div style="font-size: 1.15rem; font-weight: 600; color: #1e293b; line-height: 1.6;">
            {res.get('summary', '')}
        </div>
    </div>
    """, unsafe_allow_html=True)

    # 2. WHAT DO I NEED TO DO?
    st.markdown("""
    <div class="card-box">
        <div class="card-title">2. WHAT DO I NEED TO DO? (Action Checklist)</div>
    """, unsafe_allow_html=True)

    actions = res.get("actions", [])
    if actions:
        for idx, act in enumerate(actions, start=1):
            st.checkbox(f"**Step {idx}:** {act}", key=f"act_{idx}")
    else:
        st.write("No specific action required according to this document.")
    st.markdown("</div>", unsafe_allow_html=True)

    # 3 & 4. DEADLINE & COST (Columns)
    col1, col2 = st.columns(2)

    with col1:
        deadline_val = res.get("deadline", "Not specified")
        is_deadline_present = deadline_val.lower() != "not specified"
        st.markdown(f"""
        <div class="card-box" style="border-top: 4px solid {'#dc2626' if is_deadline_present else '#94a3b8'};">
            <div class="card-title">3. DEADLINE (WHEN?)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: {'#b91c1c' if is_deadline_present else '#475569'};">
                {deadline_val}
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.3rem;">
                {'Crucial cutoff date' if is_deadline_present else 'No deadline specified in text (Zero Hallucination)'}
            </p>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        cost_val = res.get("cost", "Not specified")
        is_fee_present = cost_val.lower() != "not specified" and "no fee" not in cost_val.lower()
        st.markdown(f"""
        <div class="card-box" style="border-top: 4px solid {'#d97706' if is_fee_present else '#059669'};">
            <div class="card-title">4. COST / FEE (HOW MUCH?)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: {'#b45309' if is_fee_present else '#047857'};">
                {cost_val}
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.3rem;">
                {'Payment required' if is_fee_present else 'Free / No fee stated in text'}
            </p>
        </div>
        """, unsafe_allow_html=True)

    # 5. IMPORTANT POINTS
    important_pts = res.get("important_points", [])
    if important_pts:
        st.markdown("""
        <div class="card-box">
            <div class="card-title">5. IMPORTANT POINTS & WARNINGS</div>
        """, unsafe_allow_html=True)
        for pt in important_pts:
            st.markdown(f"• **{pt}**")
        st.markdown("</div>", unsafe_allow_html=True)

    # 6. PROVE IT — Main Differentiating Feature
    st.markdown("### 🔎 PROVE IT — Ground Truth Evidence")
    st.markdown("SAMJHO checks every claim against the original text. No blindly trusting the model.")

    evidence_items = res.get("validated_evidence", [])
    if evidence_items:
        for ev in evidence_items:
            claim = ev.get("claim", "")
            page_num = ev.get("page", 1)
            quote = ev.get("quote", "")
            status = ev.get("status", "Unverified")
            verified = ev.get("verified", False)

            with st.expander(f"PROVE: {claim} — {'✓ VERIFIED' if verified else '⚠ UNVERIFIED'}", expanded=False):
                col_e1, col_e2 = st.columns([1, 4])
                with col_e1:
                    if verified:
                        st.markdown('<span class="verified-badge">✓ Verified</span>', unsafe_allow_html=True)
                    else:
                        st.markdown('<span class="unverified-badge">⚠ Unverified</span>', unsafe_allow_html=True)
                    st.caption(f"Source: Page {page_num}")
                with col_e2:
                    st.markdown(f'*" {quote} "*')
                    st.caption(ev.get("reason", ""))
    else:
        st.info("No specific quoted evidence generated for this document.")

    # 7. EXPLAIN IN HINDI
    st.markdown("---")
    st.markdown("### 🇮🇳 Explain in Hindi / Hinglish")
    if st.button("🗣️ Explain in Hindi (सरल भाषा में समझाइए)"):
        with st.spinner("Preparing Hindi explanation from verified facts..."):
            try:
                hindi_text = generate_hindi_explanation(res, base_url=ollama_url, model=model_name)
                st.session_state.hindi_explanation = hindi_text
            except SAMJHOAIError as e:
                st.error(str(e))
    if st.session_state.hindi_explanation:
        st.markdown(f"""
        <div class="card-box" style="background-color: #fff7ed; border-color: #ffedd5;">
            <div class="card-title" style="color: #c2410c;">सरल हिंदी व हिंगलिश स्पष्टीकरण</div>
            <div style="font-size: 1rem; color: #7c2d12; line-height: 1.7; white-space: pre-wrap;">
{st.session_state.hindi_explanation}
            </div>
        </div>
        """, unsafe_allow_html=True)

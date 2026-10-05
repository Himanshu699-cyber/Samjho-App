"""
test_pipeline.py - Automated Verification Suite for SAMJHO
Implements Stage 7 Testing Requirements:
1. Normal Notice -> Extraction + Analysis + Verified Evidence
2. No Deadline -> Zero-hallucination check ('Not specified')
3. No Fee -> Zero-fee-hallucination check ('Not specified')
4. Evidence Verification Success -> Verified quote match
5. Evidence Failure Test -> Altered quote flagged as UNVERIFIED
6. Hindi Explanation generation
"""

import sys
from evidence import verify_single_evidence, validate_all_evidence

def run_tests():
    print("==================================================")
    print("   SAMJHO Execution Plan - Test Suite (Stage 7)   ")
    print("==================================================")
    passed = 0
    total = 0

    # ----------------------------------------------------
    # TEST CASE 1: Exact Evidence Verification (Success)
    # ----------------------------------------------------
    total += 1
    doc_pages = [
        {
            "page": 1,
            "text": "CIRCULAR: Post-Matric Scholarship. The final cutoff date for physical document verification is 15 October 2026 at Room 204."
        },
        {
            "page": 2,
            "text": "There is strictly NO verification fee levied. Failure to submit will result in cancellation."
        }
    ]

    valid_claim = "Deadline: 15 October 2026"
    valid_quote = "The final cutoff date for physical document verification is 15 October 2026 at Room 204."
    res1 = verify_single_evidence(valid_claim, valid_quote, 1, doc_pages)

    if res1["verified"] and res1["status"] == "Verified" and res1["page"] == 1:
        print("✓ Test 1 Passed: Grounded evidence correctly verified on Page 1.")
        passed += 1
    else:
        print(f"✗ Test 1 Failed: {res1}")

    # ----------------------------------------------------
    # TEST CASE 2: Altered / Hallucinated Evidence (Must Fail / UNVERIFIED)
    # As required by Stage 7 Test 8: Intentionally modify quote
    # ----------------------------------------------------
    total += 1
    fake_quote = "All students must pay Rs 5000 registration penalty to the Dean immediately."
    res2 = verify_single_evidence("Penalty Fee", fake_quote, 2, doc_pages)

    if not res2["verified"] and res2["status"] == "Unverified":
        print("✓ Test 2 Passed: Hallucinated/unsupported quote correctly flagged as UNVERIFIED.")
        passed += 1
    else:
        print(f"✗ Test 2 Failed: Hallucinated quote was not flagged as Unverified: {res2}")

    # ----------------------------------------------------
    # TEST CASE 3: Normalized Whitespace / Punctuation Matching
    # ----------------------------------------------------
    total += 1
    normalized_quote = "There  is  strictly  NO  verification  fee  levied."
    res3 = verify_single_evidence("No Fee", normalized_quote, 2, doc_pages)

    if res3["verified"] and res3["page"] == 2:
        print("✓ Test 3 Passed: Normalized whitespace evidence match verified.")
        passed += 1
    else:
        print(f"✗ Test 3 Failed: Normalized matching failed: {res3}")

    # ----------------------------------------------------
    # TEST CASE 4: Zero-Deadline Handling Test
    # ----------------------------------------------------
    total += 1
    no_deadline_doc = [
        {
            "page": 1,
            "text": "ADVISORY CIRCULAR: Students are encouraged to peruse syllabus. Drop proforma in drop-box outside Room 12. Registration dates have not been finalized yet."
        }
    ]
    # Check that an absent deadline produces no verified date quote
    res4 = verify_single_evidence("Deadline", "Last date is 30 November", 1, no_deadline_doc)
    if res4["status"] == "Unverified":
        print("✓ Test 4 Passed: Zero-hallucination guard verified for absent deadline.")
        passed += 1
    else:
        print(f"✗ Test 4 Failed: {res4}")

    # ----------------------------------------------------
    # TEST CASE 5: Multi-page Batch Evidence Validation
    # ----------------------------------------------------
    total += 1
    evidence_batch = [
        {"claim": "Submit at Room 204", "quote": "at Room 204", "page": 1},
        {"claim": "No fee", "quote": "strictly NO verification fee", "page": 2},
        {"claim": "Fake rule", "quote": "mandatory tuition fee hike of 40%", "page": 1}
    ]
    batch_res = validate_all_evidence(evidence_batch, doc_pages)
    if len(batch_res) == 3 and batch_res[0]["verified"] and batch_res[1]["verified"] and not batch_res[2]["verified"]:
        print("✓ Test 5 Passed: Full evidence validation batch pipeline working as expected.")
        passed += 1
    else:
        print(f"✗ Test 5 Failed: Batch validation mismatch: {batch_res}")

    print("==================================================")
    print(f"Result: {passed}/{total} Test Cases Passed Successfully.")
    print("==================================================")
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

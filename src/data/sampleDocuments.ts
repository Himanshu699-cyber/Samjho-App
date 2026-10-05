export interface SampleDocument {
  id: string;
  title: string;
  category: 'College & Scholarship' | 'Bank & KYC' | 'Government & Utility' | 'Zero-Deadline Test' | 'Scanned OCR Demo';
  tagline: string;
  description: string;
  isScanned?: boolean;
  pages: { pageNumber: number; text: string }[];
  expectedHighlights: {
    deadlineExpected: boolean;
    feeExpected: boolean;
    primaryAction: string;
  };
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'scholarship-notice-2026',
    title: 'College Scholarship Verification Notice',
    category: 'College & Scholarship',
    tagline: 'Physical document submission for Post-Matric State Scholarship',
    description: 'A formal notice from the Dean of Student Affairs detailing mandatory physical verification of certificates, income proof, and bank passbooks.',
    pages: [
      {
        pageNumber: 1,
        text: `OFFICE OF THE DEAN (STUDENT WELFARE & SCHOLARSHIPS)
GOVERNMENT ENGINEERING COLLEGE & TECHNOLOGY CAMPUS
Ref No: GEC/SCHOL/2026/089                                          Date: October 01, 2026

CIRCULAR: MANDATORY DOCUMENT VERIFICATION FOR STATE POST-MATRIC SCHOLARSHIP (AY 2026-27)

It is hereby notified for the information of all undergraduate and postgraduate students who have provisionally applied for the Post-Matric State Merit & Need-Based Scholarship Scheme for the academic year 2026-27 that physical scrutiny of all supporting documents is mandatory.

The portal scrutiny has flagged incomplete profiles. Therefore, all concerned applicants are instructed to present themselves for physical verification at Room No. 204, Administrative Block (Second Floor) between 10:30 AM and 4:30 PM on official working days.

The final cutoff date for physical document verification is 15 October 2026. No applications shall be entertained or validated on the state portal after 5:00 PM on 15 October 2026 under any circumstances.`
      },
      {
        pageNumber: 2,
        text: `CHECKLIST OF MANDATORY ENCLOSURES:
1. Two hard copies of the system-generated Scholarship Application Form duly signed by the applicant and parent/guardian.
2. Original Tahsildar-issued Annual Family Income Certificate (valid for financial year 2025-26, showing total income below Rs. 2,50,000/- per annum).
3. Self-attested photocopy of Candidate's Aadhaar Card linked to active bank account.
4. First page photocopy of Nationalized Bank Passbook clearly displaying Account Number and IFSC Code.
5. Original College Fee Receipt of current semester for authentication.

FEE INFORMATION:
There is strictly NO verification fee or processing charge levied by the institution for this verification procedure. Students are cautioned against entertaining any unauthorized demands.

CONSEQUENCES OF NON-COMPLIANCE:
Failure to submit the physical dossier and obtain counter-signature before 15 October 2026 will result in immediate forfeiture and permanent de-registration of the candidate's scholarship claim. The candidate will bear full liability for payment of regular tuition fees.

By Order,
Dr. S. K. Narayanan
Dean of Student Welfare`
      }
    ],
    expectedHighlights: {
      deadlineExpected: true,
      feeExpected: false,
      primaryAction: 'Submit original income certificate and documents at Room 204 by 15 Oct 2026'
    }
  },
  {
    id: 'bank-rekyc-freeze',
    title: 'Bank Re-KYC Account Freeze Warning',
    category: 'Bank & KYC',
    tagline: 'Periodic KYC update requirement under RBI guidelines',
    description: 'Official letter from Retail Banking Operations alerting customer of impending debit freeze due to expired KYC documentation.',
    pages: [
      {
        pageNumber: 1,
        text: `APEX NATIONAL BANK
Retail Banking Operations & Customer Compliance Cell
Plot 45, Financial City Centre, Mumbai - 400051

NOTICE OF IMPENDING ACCOUNT OPERATION RESTRICTION (RE-KYC COMPLIANCE)
Date: 28 September 2026
To: Account Holder (Savings A/C No: 40982711002384)

Dear Customer,

In accordance with Reserve Bank of India (RBI) master directions on Know Your Customer (KYC) norms, commercial banks are mandated to periodically update customer identification dossiers for high and medium risk categorized accounts.

Our records indicate that the mandatory periodic Re-KYC for your account is overdue as of 15 September 2026. Consequently, your savings account has been placed under temporary operational surveillance.

REQUIRED ACTION FROM YOUR END:
You are requested to complete your Re-KYC update within 30 days from the date of this letter, i.e., on or before 28 October 2026.

Submission Channels:
1. Physical Branch Visit: Submit self-attested copies of Officially Valid Documents (OVD) at your home branch or any nearest Apex National Bank branch.
2. Video-KYC Portal: Alternatively, eligible resident individuals may log on to https://netbanking.apexbank.co.in/rekyc and complete biometric facial verification.`
      },
      {
        pageNumber: 2,
        text: `DOCUMENTS REQUIRED:
- Permanent Account Number (PAN) Card or Form 60.
- Aadhaar Card (with masked first 8 digits) along with signed offline paperless e-KYC consent.
- Current Proof of Residential Address (Utility bill, Passport, or Voter ID not older than 2 months).
- One recent passport-sized color photograph.

FINANCIAL CHARGES & PENAL CONSEQUENCES:
If the Re-KYC documentation is not updated by 28 October 2026, a Partial Debit Freeze will be enforced on your account without further notice. Outward transactions, UPI transfers, ATM withdrawals, and auto-debit ECS mandates will be halted.

Furthermore, a regulatory non-compliance penalty charge of Rs. 150 plus applicable GST will be levied upon account suspension.

Sincerely,
Chief Manager (Compliance & Customer Due Diligence)
Apex National Bank`
      }
    ],
    expectedHighlights: {
      deadlineExpected: true,
      feeExpected: true,
      primaryAction: 'Submit PAN and Aadhaar copies at branch or via Video-KYC before 28 Oct 2026'
    }
  },
  {
    id: 'electricity-disconnection',
    title: 'Electricity Overdue Disconnection Notice',
    category: 'Government & Utility',
    tagline: 'Statutory 15-day final notice before physical meter disconnection',
    description: 'Urgent utility notice issued under Section 56 of Electricity Act regarding unpaid arrears and scheduled power disconnection.',
    pages: [
      {
        pageNumber: 1,
        text: `STATE POWER DISTRIBUTION CORPORATION LIMITED (SPDCL)
Sub-Divisional Office, Electricity Revenue Section
Consumer CA No: 100984521 | Meter No: SP-884129

FINAL STATUTORY NOTICE UNDER SECTION 56(1) OF THE ELECTRICITY ACT, 2003
Notice Issue Date: 02 October 2026

To: Domestic Consumer
Subject: Default in payment of electricity charges amounting to Rs. 2,450/- and notice of termination of power supply.

Sir/Madam,
Please take notice that an aggregate amount of Rs. 2,450/- (Rupees Two Thousand Four Hundred and Fifty only), comprising unpaid energy consumption charges of Rs. 2,150/- and late surcharge of Rs. 300/-, remains outstanding against your service connection for bill cycle August-September 2026.

Despite prior bill reminders, the aforesaid sum has not been credited to our billing ledger.

DEADLINE FOR SETTLEMENT:
You are hereby called upon to pay the entire outstanding dues of Rs. 2,450/- on or before 20 October 2026.

Payment Modes Accepted:
- Online via SPDCL Citizen Portal or Bharat Bill Payment System (BBPS).
- Cash/Demand Draft at the Cash Counter, Sub-Divisional Office, Sector 4.`
      },
      {
        pageNumber: 2,
        text: `CONSEQUENCE OF NON-PAYMENT:
In the event of failure to pay the full demand amount by 5:00 PM on 20 October 2026, the electricity supply to your premises will be disconnected without any further reference.

RECONNECTION CONDITIONS:
Please note that in case of disconnection, power supply shall only be restored upon:
1. Clearing full arrears of Rs. 2,450/-
2. Payment of a mandatory Reconnection Fee of Rs. 350/- for single phase domestic supply.
3. Physical re-inspection by junior engineer (may take up to 48 hours).

Assistant Engineer (Revenue)
Sub-Division IV, SPDCL`
      }
    ],
    expectedHighlights: {
      deadlineExpected: true,
      feeExpected: true,
      primaryAction: 'Pay outstanding bill of Rs. 2,450 before 20 October 2026 to prevent disconnection'
    }
  },
  {
    id: 'exam-elective-no-deadline',
    title: 'University Elective Registration (Zero Deadline Test)',
    category: 'Zero-Deadline Test',
    tagline: 'Notice with NO deadline and NO fee — Tests Zero Hallucination',
    description: 'An advisory guideline circular informing students about open electives. Crucial test: AI must state "Not mentioned" rather than inventing a fake deadline or fee.',
    pages: [
      {
        pageNumber: 1,
        text: `CENTRAL METROPOLITAN UNIVERSITY
Department of Academic Affairs & Curriculum Planning
Notice Ref: CMU/ACAD/ELEC/2026-GEN

ADVISORY CIRCULAR: INTRODUCTION OF INTERDISCIPLINARY OPEN ELECTIVES

This is to bring to the notice of all Semester IV and Semester VI undergraduate students that the Academic Council has approved a new bouquet of Interdisciplinary Open Electives commencing next semester.

Students are encouraged to peruse the detailed course syllabus handbook uploaded on the university intranet repository and consult with their respective Faculty Advisors regarding credit compatibility.

SUBMISSION PROCEDURE:
Interested students should download the Course Preference Proforma, indicate three preferred electives in order of priority, obtain the signature of their departmental mentor, and place the signed sheet into the departmental drop-box located outside Room 12.

FEE DETAILS:
There is no fee whatsoever associated with elective course selection or proforma submission. Course allocation is entirely based on merit and available laboratory capacity.`
      },
      {
        pageNumber: 2,
        text: `TIMELINE & REGISTRATION DATES:
The exact schedule and registration cut-off dates for elective enrollment have not been finalized yet. The detailed registration timetable and portal opening dates will be notified in due course through a separate notification.

Students are advised to keep checking the official university website noticeboard regularly for further updates.

Registrar (Academics)
Central Metropolitan University`
      }
    ],
    expectedHighlights: {
      deadlineExpected: false,
      feeExpected: false,
      primaryAction: 'Download proforma, choose 3 electives, and drop signed sheet into Room 12 drop-box'
    }
  },
  {
    id: 'scanned-challan-ocr',
    title: 'Traffic E-Challan Notice (Simulated Scanned Document)',
    category: 'Scanned OCR Demo',
    tagline: 'Simulated scanned municipal traffic violation document',
    description: 'Demonstrates handling of image-based or noisy scanned documents where text is extracted via OCR processing.',
    isScanned: true,
    pages: [
      {
        pageNumber: 1,
        text: `[SCANNED DOCUMENT - OCR EXTRACTED TEXT]
METROPOLITAN TRAFFIC POLICE DEPARTMENT
E-CHALLAN ENFORCEMENT BRANCH
VIOLATION ADVICE NO: DL-2026-CH-994102

AUTOMATED CAMERA ENFORCEMENT NOTICE
Date of Violation: 25-09-2026 | Time: 14:22:10 IST
Location: Outer Ring Road Junction, Camera Tower 04
Vehicle Registration: MH-02-CD-4421

VIOLATION DETECTED:
Over-speeding (Exceeding designated urban corridor speed limit by 24 km/h)
Statutory Offence under Section 183 of Motor Vehicles (Amendment) Act.

PENALTY COMPOUNDING AMOUNT:
Compounding Fine: Rs. 1,000/- (Rupees One Thousand only).

PAYMENT TIMELINE:
The compounding fee must be deposited within 15 days of service of this notice, i.e., latest by 10 October 2026.

DISPUTE / PAYMENT:
Payment can be rendered online at https://echallan.trafficpolice.gov.in using Challan No. DL-2026-CH-994102.
If you dispute this violation, you must appear before the Virtual Court within the stipulated 15-day period.`
      }
    ],
    expectedHighlights: {
      deadlineExpected: true,
      feeExpected: true,
      primaryAction: 'Pay Rs. 1,000 fine online or contest in Virtual Court before 10 October 2026'
    }
  }
];

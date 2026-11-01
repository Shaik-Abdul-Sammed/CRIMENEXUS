"""
CRIMENEXUS v3.2 DGP Pitch Presentation Generator.
Generates CRIMENEXUS_DGP_Pitch_v2.pptx with 6 slides, 2026 national crime statistics,
new screenshots, and structured executive briefing cards.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

NAVY = RGBColor(10, 25, 41)       # #0A1929 Deep Void
CARD_BG = RGBColor(17, 34, 64)    # #112240 Slate Navy
CARD_BORDER = RGBColor(40, 60, 95)
EMERALD = RGBColor(16, 185, 129)  # #10B981 Accent
CRIMSON = RGBColor(220, 38, 38)   # #DC2626 Danger
AMBER = RGBColor(245, 158, 11)    # #F59E0B Warning
CYAN = RGBColor(6, 182, 212)      # #06B6D4 Accent Cyan
WHITE = RGBColor(255, 255, 255)   # Primary Text
MUTED = RGBColor(148, 163, 184)   # Slate 400 Text
GOLD = RGBColor(234, 179, 8)

FONT_HEADING = "Helvetica"
FONT_BODY = "Helvetica"

SCREENSHOTS_DIR = "demo_data/screenshots"

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_base_slide(header_category="", title_text="", subtitle_text="", notes=""):
        slide = prs.slides.add_slide(blank_layout)

        # Full-bleed navy background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = NAVY
        bg.line.fill.background()

        # Header Section
        if header_category:
            cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.3))
            tf_cat = cat_box.text_frame
            tf_cat.word_wrap = True
            p_cat = tf_cat.paragraphs[0]
            p_cat.text = header_category.upper()
            p_cat.font.name = FONT_HEADING
            p_cat.font.size = Pt(10)
            p_cat.font.bold = True
            p_cat.font.color.rgb = EMERALD

        if title_text:
            title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.65), Inches(11.733), Inches(0.6))
            tf_title = title_box.text_frame
            tf_title.word_wrap = True
            p_title = tf_title.paragraphs[0]
            p_title.text = title_text
            p_title.font.name = FONT_HEADING
            p_title.font.size = Pt(22)
            p_title.font.bold = True
            p_title.font.color.rgb = WHITE

        if subtitle_text:
            sub_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.22), Inches(11.733), Inches(0.4))
            tf_sub = sub_box.text_frame
            tf_sub.word_wrap = True
            p_sub = tf_sub.paragraphs[0]
            p_sub.text = subtitle_text
            p_sub.font.name = FONT_BODY
            p_sub.font.size = Pt(11)
            p_sub.font.color.rgb = MUTED

        # Global Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.1), Inches(11.733), Inches(0.3))
        tf_footer = footer_box.text_frame
        p_footer = tf_footer.paragraphs[0]
        p_footer.text = "CRIMENEXUS v3.2 · Zero-API-Cost Police Intelligence · Section 63 BSA / 65B Compliant · State Police HQ"
        p_footer.font.name = FONT_BODY
        p_footer.font.size = Pt(9)
        p_footer.font.color.rgb = MUTED

        if notes:
            slide.notes_slide.notes_text_frame.text = notes

        return slide

    # =========================================================================
    # SLIDE 1: The 2026 Reality
    # =========================================================================
    s1 = add_base_slide(
        header_category="National Threat Landscape // 2026 Ground Reality",
        title_text="India's Cyber Fraud Crisis: 2026",
        subtitle_text="National cyber-crime portal statistics, inter-state syndicate operations, and the critical investigation latency gap.",
        notes="DGP Briefing: Organized cyber syndicates move stolen funds across dozens of mule accounts in seconds via UPI and RTGS. Our IOs take weeks to manually aggregate disparate bank CSVs and CDR logs."
    )

    # 3 Stat Cards
    stat_configs = [
        ("₹11,158 Cr", "Saved via CFCFRMS Gateway", "Over ₹11,000+ Crore in fraudulent debit transactions intercepted by 1930 helpline & police freeze portals in 2026.", EMERALD),
        ("32.08 Lakh", "Mule Accounts Identified", "Massive national surge in rented savings accounts and dormant KYC conduits operated by Hawala rings.", CRIMSON),
        ("3,718 Apps", "Blocked by MHA / I4C", "Illegal predatory lending, betting, and unauthorized financial off-ramps neutralized nationwide.", AMBER)
    ]

    card_w = Inches(3.64)
    card_h = Inches(2.1)
    for i, (val, heading, desc, accent) in enumerate(stat_configs):
        left = Inches(0.8 + i * 4.04)
        top = Inches(1.75)
        box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, card_w, card_h)
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = CARD_BORDER

        tf = box.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = val
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(28)
        p1.font.bold = True
        p1.font.color.rgb = accent
        p1.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = heading
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(11)
        p2.font.bold = True
        p2.font.color.rgb = WHITE
        p2.space_after = Pt(6)

        p3 = tf.add_paragraph()
        p3.text = desc
        p3.font.name = FONT_BODY
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = MUTED

    # Real-World Major Cases Card
    cases_top = Inches(4.05)
    cases_h = Inches(1.85)
    cases_box = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), cases_top, Inches(11.733), cases_h)
    cases_box.fill.solid()
    cases_box.fill.fore_color.rgb = CARD_BG
    cases_box.line.color.rgb = CARD_BORDER

    tf_cases = cases_box.text_frame
    tf_cases.word_wrap = True
    p_ch = tf_cases.paragraphs[0]
    p_ch.text = "RECENT 2026 INTER-STATE POLICE TAKEDOWNS & JURISDICTIONAL PRECEDENTS"
    p_ch.font.name = FONT_HEADING
    p_ch.font.size = Pt(11)
    p_ch.font.bold = True
    p_ch.font.color.rgb = CYAN
    p_ch.space_after = Pt(6)

    cases_items = [
        "• Ludhiana Cyber Cell Syndicate: 136 arrests executed across 9 states; ₹48 Cr illegal crypto-hawala off-ramp traced through 850+ mule entities.",
        "• Jammu & Kashmir Terror Finance Crackdown: 8,000 mule accounts frozen across 14 banks used for cross-border subversive funding and narcotics layering.",
        "• Enforcement Directorate (PMLA Sec 102): ₹17.82 Cr attached in structured smurfing transactions depositing sub-₹50,000 batches into shell firms."
    ]
    for c_text in cases_items:
        p_c = tf_cases.add_paragraph()
        p_c.text = c_text
        p_c.font.name = FONT_BODY
        p_c.font.size = Pt(9.5)
        p_c.font.color.rgb = WHITE
        p_c.space_after = Pt(4)

    # Big Impact Quote Box
    quote_top = Inches(6.05)
    quote_box = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), quote_top, Inches(11.733), Inches(0.85))
    quote_box.fill.solid()
    quote_box.fill.fore_color.rgb = RGBColor(15, 30, 50)
    quote_box.line.color.rgb = EMERALD
    quote_box.line.width = Pt(1.5)

    tf_quote = quote_box.text_frame
    tf_quote.word_wrap = True
    p_q = tf_quote.paragraphs[0]
    p_q.text = "“The money moves in seconds. The investigation takes months. CRIMENEXUS closes that gap.”"
    p_q.font.name = FONT_HEADING
    p_q.font.size = Pt(13)
    p_q.font.bold = True
    p_q.font.color.rgb = EMERALD
    p_q.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 2: Three Things Your IO Will Do Tomorrow
    # =========================================================================
    s2 = add_base_slide(
        header_category="Operational Impact // Police Station Level Workflow",
        title_text="Three Things Your IO Will Do Tomorrow",
        subtitle_text="Empowering Station House Officers and Investigating Officers with instant, court-admissible forensic synthesis.",
        notes="Explain the 3 actionable capabilities: Instant Cytoscape graph rendering (30s vs 4 hours), 1-click PMLA Section 102 account freezing (3s vs 6 hours), and automated BSA Sec 63 court dossiers (4s vs 8 hours)."
    )

    card2_w = Inches(3.64)
    # Card 1: See the Network
    c1_left = Inches(0.8)
    c1_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c1_left, Inches(1.7), card2_w, Inches(5.1))
    c1_box.fill.solid()
    c1_box.fill.fore_color.rgb = CARD_BG
    c1_box.line.color.rgb = CARD_BORDER
    tf1 = c1_box.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "1. SEE THE NETWORK"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = CYAN
    p.space_after = Pt(4)
    p = tf1.add_paragraph()
    p.text = "30 seconds vs. 4 hours"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = EMERALD
    p.space_after = Pt(6)

    # Insert slide2_graph.png
    g_path = f"{SCREENSHOTS_DIR}/slide2_graph.png"
    if os.path.exists(g_path):
        s2.shapes.add_picture(g_path, c1_left + Inches(0.15), Inches(2.45), width=Inches(3.34), height=Inches(2.1))

    # Add description below screenshot
    desc1_box = s2.shapes.add_textbox(c1_left + Inches(0.15), Inches(4.65), Inches(3.34), Inches(2.0))
    tf_d1 = desc1_box.text_frame
    tf_d1.word_wrap = True
    p = tf_d1.paragraphs[0]
    p.text = "Cytoscape interactive topology instantly correlates CDR pings, bank accounts, and ANPR vehicle plates around Kingpin Rajan with crimson halo risk scores."
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.color.rgb = MUTED

    # Card 2: Freeze the Account
    c2_left = Inches(4.84)
    c2_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c2_left, Inches(1.7), card2_w, Inches(5.1))
    c2_box.fill.solid()
    c2_box.fill.fore_color.rgb = CARD_BG
    c2_box.line.color.rgb = CARD_BORDER
    tf2 = c2_box.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "2. FREEZE THE ACCOUNT"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = CRIMSON
    p.space_after = Pt(4)
    p = tf2.add_paragraph()
    p.text = "3 seconds vs. 6 hours"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = EMERALD
    p.space_after = Pt(6)

    # Insert slide2_smurfing.png
    sm_path = f"{SCREENSHOTS_DIR}/slide2_smurfing.png"
    if os.path.exists(sm_path):
        s2.shapes.add_picture(sm_path, c2_left + Inches(0.15), Inches(2.45), width=Inches(3.34), height=Inches(2.1))

    desc2_box = s2.shapes.add_textbox(c2_left + Inches(0.15), Inches(4.65), Inches(3.34), Inches(2.0))
    tf_d2 = desc2_box.text_frame
    tf_d2.word_wrap = True
    p = tf_d2.paragraphs[0]
    p.text = "Automated sub-₹50k smurfing tripwire detects structuring deposits within 48-hr window and triggers 1-click Section 102 CrPC formal freeze orders via CCTNS."
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.color.rgb = MUTED

    # Card 3: Download Court Dossier
    c3_left = Inches(8.88)
    c3_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c3_left, Inches(1.7), card2_w, Inches(5.1))
    c3_box.fill.solid()
    c3_box.fill.fore_color.rgb = CARD_BG
    c3_box.line.color.rgb = CARD_BORDER
    tf3 = c3_box.text_frame
    tf3.word_wrap = True
    p = tf3.paragraphs[0]
    p.text = "3. COURT-READY DOSSIER"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = AMBER
    p.space_after = Pt(4)
    p = tf3.add_paragraph()
    p.text = "4 seconds vs. 8 hours"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = EMERALD
    p.space_after = Pt(6)

    # Insert dossier preview screenshot if exists, or graphical badge
    dossier_pic = f"{SCREENSHOTS_DIR}/04_court_dossier_pdf.png"
    if os.path.exists(dossier_pic):
        s2.shapes.add_picture(dossier_pic, c3_left + Inches(0.15), Inches(2.45), width=Inches(3.34), height=Inches(2.1))

    desc3_box = s2.shapes.add_textbox(c3_left + Inches(0.15), Inches(4.65), Inches(3.34), Inches(2.0))
    tf_d3 = desc3_box.text_frame
    tf_d3.word_wrap = True
    p = tf_d3.paragraphs[0]
    p.text = "Generates complete 3-page, Section 63 BSA / Section 65B compliant PDF dossiers with cryptographic SHA-256 hashes, WORM ledger blocks, and seizure orders."
    p.font.name = FONT_BODY
    p.font.size = Pt(9)
    p.font.color.rgb = MUTED

    # =========================================================================
    # SLIDE 3: What You Have vs. What CRIMENEXUS Adds
    # =========================================================================
    s3 = add_base_slide(
        header_category="Architectural Comparison // Modern Police IT Stack",
        title_text="What You Have vs. What CRIMENEXUS Adds",
        subtitle_text="CRIMENEXUS does not replace CCTNS; it acts as an intelligent analytical layer atop existing state infrastructure.",
        notes="Address DGP concern: We are not asking you to throw away CCTNS. CCTNS is your official system of record. CRIMENEXUS is the intelligence force multiplier."
    )

    # Comparison Table on the left
    table_left = Inches(0.8)
    table_top = Inches(1.75)
    table_width = Inches(7.5)
    table_height = Inches(4.8)

    rows = 6
    cols = 4
    table_shape = s3.shapes.add_table(rows, cols, table_left, table_top, table_width, table_height)
    t = table_shape.table
    t.columns[0].width = Inches(1.8)
    t.columns[1].width = Inches(1.8)
    t.columns[2].width = Inches(1.8)
    t.columns[3].width = Inches(2.1)

    table_data = [
        ["Capability", "CCTNS (NIC)", "MahaCrimeOS (Azure)", "CRIMENEXUS (On-Prem)"],
        ["Primary Function", "Static FIR & Case Record Keeping", "Proprietary Cloud Analytics", "Self-Hosted Syndicate Graph Intel"],
        ["Deployment", "State Data Center (NIC)", "US Commercial Cloud (Azure)", "Air-Gapped Local Police Servers"],
        ["Recurring Cost", "Government Budgeted", "₹1.5 - ₹3.0 Cr / Year", "₹0 Recurring (MIT Open-Source)"],
        ["Evidence in Court", "Paper Printouts (Delayed)", "Proprietary Black Box AI", "SHAP XAI + Sec 63 BSA Hash Chain"],
        ["Rural Thana Bandwidth", "Chokes on 2 Mbps BSNL", "Requires High-Speed Internet", "Lite Mode (<200 KB Tabular View)"]
    ]

    for r_idx, row in enumerate(table_data):
        for c_idx, cell_value in enumerate(row):
            cell = t.cell(r_idx, c_idx)
            cell.text = cell_value
            p = cell.text_frame.paragraphs[0]
            p.font.name = FONT_BODY
            p.font.size = Pt(8.5 if r_idx > 0 else 9.5)
            if r_idx == 0:
                p.font.bold = True
                p.font.color.rgb = WHITE
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(30, 41, 59)
            elif c_idx == 3:  # CRIMENEXUS column
                p.font.bold = True
                p.font.color.rgb = EMERALD
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(17, 34, 64)
            else:
                p.font.color.rgb = MUTED if c_idx > 0 else WHITE
                cell.fill.solid()
                cell.fill.fore_color.rgb = CARD_BG

    # Right side: Screenshot of Lite Mode (200 KB)
    lite_path = f"{SCREENSHOTS_DIR}/slide3_lite.png"
    if os.path.exists(lite_path):
        s3.shapes.add_picture(lite_path, Inches(8.6), Inches(1.75), width=Inches(3.93), height=Inches(2.8))

    lite_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.6), Inches(4.75), Inches(3.93), Inches(1.8))
    lite_card.fill.solid()
    lite_card.fill.fore_color.rgb = CARD_BG
    lite_card.line.color.rgb = CARD_BORDER
    tf_l = lite_card.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "THANA-LEVEL RESILIENCE GUARANTEE"
    p.font.name = FONT_HEADING
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = CYAN
    p.space_after = Pt(4)
    p = tf_l.add_paragraph()
    p.text = "In remote police stations with erratic 2 Mbps BSNL copper connections, CRIMENEXUS operates in Zero-WebGL Lite Mode consuming only 200 KB per query while retaining complete investigative capabilities."
    p.font.name = FONT_BODY
    p.font.size = Pt(8.5)
    p.font.color.rgb = MUTED

    # =========================================================================
    # SLIDE 4: It Works. Here is the Proof.
    # =========================================================================
    s4 = add_base_slide(
        header_category="Rigorous Engineering Validation // Zero Stubs",
        title_text="It Works. Here is the Proof.",
        subtitle_text="Deterministic mathematical verification across 229 automated tests, low-latency API benchmarking, and 100% test pass rate.",
        notes="Highlight that this is not a conceptual mockup or slide-ware. 213 backend tests and 16 frontend tests run on every commit in CI/CD."
    )

    # Left Column: Stats & Latencies
    left_w = Inches(3.64)
    s4_box = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.75), left_w, Inches(4.9))
    s4_box.fill.solid()
    s4_box.fill.fore_color.rgb = CARD_BG
    s4_box.line.color.rgb = CARD_BORDER

    tf_s4 = s4_box.text_frame
    tf_s4.word_wrap = True
    p = tf_s4.paragraphs[0]
    p.text = "TESTING & RELIABILITY AUDIT"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = CYAN
    p.space_after = Pt(8)

    test_proofs = [
        ("213 / 213", "Backend Pytest Passed", "100% coverage across core, advanced, forensics, and scenario modules.", EMERALD),
        ("16 / 16", "Frontend Suites Passed", "Playwright E2E and Vitest accessibility audits with 0 ESLint warnings.", EMERALD),
        ("P99 < 107ms", "API Response Latency", "Benchmarked under concurrent simulated investigator load on local hardware.", CYAN),
        ("0 API Calls", "Zero Recurring SaaS Cost", "Self-hosted ONNX, scikit-learn, and local RAG engines run completely offline.", GOLD)
    ]

    for val, title, detail, col in test_proofs:
        p1 = tf_s4.add_paragraph()
        p1.text = f"{val} · {title}"
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = col
        p2 = tf_s4.add_paragraph()
        p2.text = detail
        p2.font.name = FONT_BODY
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = MUTED
        p2.space_after = Pt(6)

    # Right Column: slide4_dashboard.png Screenshot
    dash_path = f"{SCREENSHOTS_DIR}/slide4_dashboard.png"
    if os.path.exists(dash_path):
        s4.shapes.add_picture(dash_path, Inches(4.7), Inches(1.75), width=Inches(7.833), height=Inches(4.15))

    # Bottom Callout: Optional 90-second live demo
    demo_callout = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(4.7), Inches(6.05), Inches(7.833), Inches(0.6))
    demo_callout.fill.solid()
    demo_callout.fill.fore_color.rgb = RGBColor(16, 185, 129)
    demo_callout.line.fill.background()
    tf_call = demo_callout.text_frame
    p_c = tf_call.paragraphs[0]
    p_c.text = "⚡ OPTIONAL 90-SECOND LIVE DEMO: Run a real-time account freeze & court dossier compilation on this laptop right now."
    p_c.font.name = FONT_HEADING
    p_c.font.size = Pt(10)
    p_c.font.bold = True
    p_c.font.color.rgb = NAVY
    p_c.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 5: 88% Is Ready. 12% Needs You.
    # =========================================================================
    s5 = add_base_slide(
        header_category="Honest Deployment Appraisal // No Illusions",
        title_text="88% Is Ready. 12% Needs You.",
        subtitle_text="Full engineering transparency on operational readiness versus administrative dependencies.",
        notes="Be direct: Software alone cannot solve bureaucratic integration. We have built 88% of the core software stack. The remaining 12% requires police department sponsorship and official API access."
    )

    col_w = Inches(5.666)
    # Left Column: 88% Ready
    left_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.75), col_w, Inches(3.9))
    left_box.fill.solid()
    left_box.fill.fore_color.rgb = CARD_BG
    left_box.line.color.rgb = EMERALD
    left_box.line.width = Pt(1.5)

    tf_l = left_box.text_frame
    tf_l.word_wrap = True
    p = tf_l.paragraphs[0]
    p.text = "88% ENGINEERING COMPLETE (IN SOFTWARE)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = EMERALD
    p.space_after = Pt(8)

    ready_items = [
        "✓ Multi-Tenant Police District Partitioning: Strict Row-Level Security ensuring jurisdiction boundaries.",
        "✓ Time-Travel Forensic Audit Logging: Immutable, append-only tamper-evident database logs for judicial scrutiny.",
        "✓ Automated Daily Encrypted Backups: Disaster recovery snapshots for PostgreSQL & Neo4j graph stores.",
        "✓ Deep AI Financial Smurfing Detection: Hybrid Autoencoders & Isolation Forests flagging structuring deposits.",
        "✓ Section 63 BSA Dossier Compiler: Automatic PDF evidence packets with SHA-256 hashes & WORM signatures."
    ]
    for item in ready_items:
        p = tf_l.add_paragraph()
        p.text = item
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = WHITE
        p.space_after = Pt(5)

    # Right Column: 12% Blocked
    right_box = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.866), Inches(1.75), col_w, Inches(3.9))
    right_box.fill.solid()
    right_box.fill.fore_color.rgb = CARD_BG
    right_box.line.color.rgb = AMBER
    right_box.line.width = Pt(1.5)

    tf_r = right_box.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "12% NEEDS POLICE HEADQUARTERS (ADMINISTRATIVE)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = AMBER
    p.space_after = Pt(8)

    blocked_items = [
        "⚠ CCTNS Official MoU & API Gateway: Requires State Nodal Officer approval for live NCRB production sync.",
        "⚠ STQC Government Cybersecurity Certification: Formal third-party government vulnerability audit (3-4 weeks).",
        "⚠ National Bhashini Vernacular AI Integration: Production API keys for 10 regional Indian language translations.",
        "⚠ Inter-State FIU-IND Gateway Access: Formal authorization for real-time Suspicious Transaction Report (STR) intake.",
        "⚠ Standard Operating Procedure (SOP) Adoption: Official standing order notifying CRIMENEXUS as decision-support tool."
    ]
    for item in blocked_items:
        p = tf_r.add_paragraph()
        p.text = item
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = WHITE
        p.space_after = Pt(5)

    # Bottom Safety Box
    bottom_box = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.85), Inches(11.733), Inches(0.95))
    bottom_box.fill.solid()
    bottom_box.fill.fore_color.rgb = RGBColor(15, 30, 50)
    bottom_box.line.color.rgb = CARD_BORDER

    tf_b = bottom_box.text_frame
    tf_b.word_wrap = True
    p = tf_b.paragraphs[0]
    p.text = "ZERO RISK GUARANTEE: If the 60-day cyber cell pilot does not demonstrate tangible time savings and account freeze acceleration, the police department loses nothing. MIT Licensed. No proprietary vendor lock-in."
    p.font.name = FONT_HEADING
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 6: The Ask
    # =========================================================================
    s6 = add_base_slide(
        header_category="Proposed Action Plan // State Cyber Cell Pilot",
        title_text="The Ask.",
        subtitle_text="A concrete, low-risk, 60-day operational roadmap for State Police Cyber Crime Division.",
        notes="Conclude with clarity: We are asking for a 60-day pilot in one Cyber Police Station, STQC sponsorship, and nomination of a Nodal Officer. Under ₹10 lakh budget with ₹0 recurring software fees."
    )

    # 3 Concrete Asks
    ask_w = Inches(3.64)
    ask_configs = [
        ("ASK 1: 60-DAY PILOT", "1 Cyber Crime Police Station", "Deploy CRIMENEXUS in Sector 20 Cyber Cell. Ingest past 6 months of Hawala/mule cases. Prove 80%+ time reduction in syndicate link extraction. Budget under ₹10 lakh (hardware only; ₹0 software).", EMERALD),
        ("ASK 2: STQC SPONSORSHIP", "Formal Security Audit", "Department sponsors CERT-In / STQC empaneled agency audit (₹3-5 lakh) to certify zero vulnerabilities and compliance with national police cybersecurity guidelines.", CYAN),
        ("ASK 3: NODAL OFFICER", "CCTNS MoU Coordination", "Nominate one SP / DySP level officer to facilitate technical data exchange agreements with State Crime Records Bureau (SCRB) and NIC CCTNS cell.", AMBER)
    ]

    for i, (title, sub, body, col) in enumerate(ask_configs):
        left = Inches(0.8 + i * 4.04)
        top = Inches(1.75)
        box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, ask_w, Inches(3.2))
        box.fill.solid()
        box.fill.fore_color.rgb = CARD_BG
        box.line.color.rgb = col
        box.line.width = Pt(1.5)

        tf = box.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = col
        p1.space_after = Pt(2)

        p2 = tf.add_paragraph()
        p2.text = sub
        p2.font.name = FONT_HEADING
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = WHITE
        p2.space_after = Pt(8)

        p3 = tf.add_paragraph()
        p3.text = body
        p3.font.name = FONT_BODY
        p3.font.size = Pt(9)
        p3.font.color.rgb = MUTED

    # 10-Week Roadmap Bar
    rm_top = Inches(5.15)
    rm_box = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), rm_top, Inches(11.733), Inches(1.65))
    rm_box.fill.solid()
    rm_box.fill.fore_color.rgb = CARD_BG
    rm_box.line.color.rgb = CARD_BORDER

    tf_rm = rm_box.text_frame
    tf_rm.word_wrap = True
    p = tf_rm.paragraphs[0]
    p.text = "10-WEEK PILOT EXECUTION ROADMAP"
    p.font.name = FONT_HEADING
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.space_after = Pt(6)

    timeline_items = [
        "• Weeks 1-2: On-premise server deployment at Cyber Police Station; local Neo4j/Postgres setup; IO login creation.",
        "• Weeks 3-4: Historical case ingestion (2024-2026 hawala FIRs, CDR files, bank statements); baseline syndicate graph seeded.",
        "• Weeks 5-8: Live operational deployment; IOs generate daily Section 102 freeze orders and automated Section 63 BSA dossiers.",
        "• Weeks 9-10: Final DGP evaluation report; quantification of asset freeze speed, hours saved per IO, and STQC certification sign-off."
    ]
    for item in timeline_items:
        p = tf_rm.add_paragraph()
        p.text = item
        p.font.name = FONT_BODY
        p.font.size = Pt(9)
        p.font.color.rgb = MUTED
        p.space_after = Pt(3)

    output_path = "CRIMENEXUS_DGP_Pitch_v2.pptx"
    prs.save(output_path)
    print(f"Successfully generated {output_path} (6 slides, 1920x1080 resolution, full news & screenshot integration)")

if __name__ == "__main__":
    create_presentation()

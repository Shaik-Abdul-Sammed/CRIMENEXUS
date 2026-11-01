"""
CRIMENEXUS v3.0 DGP Pitch Presentation Generator.
Produces CRIMENEXUS_DGP_Pitch.pptx with 6 production slides according to exact specifications.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

NAVY = RGBColor(10, 25, 41)       # #0A1929
CARD_BG = RGBColor(18, 38, 58)    # #12263A
EMERALD = RGBColor(16, 185, 129)  # #10B981
CRIMSON = RGBColor(220, 38, 38)   # #DC2626
AMBER = RGBColor(245, 158, 11)    # #F59E0B
WHITE = RGBColor(255, 255, 255)   # #FFFFFF
MUTED = RGBColor(148, 163, 184)   # #94A3B8

FONT_HEADING = "Inter"
FONT_BODY = "Inter"


def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def add_base_slide(notes_text=""):
        slide = prs.slides.add_slide(blank_layout)
        # Full-bleed navy background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = NAVY
        bg.line.fill.background()

        # Global Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
        tf = footer_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = "CRIMENEXUS v3.0 · MIT License · Zero API Costs · Commit 07bf9c2"
        p.font.name = FONT_BODY
        p.font.size = Pt(11)
        p.font.color.rgb = MUTED

        if notes_text:
            slide.notes_slide.notes_text_frame.text = notes_text

        return slide

    # =========================================================================
    # SLIDE 1: The 4-Month Case That Should Have Taken 4 Days
    # =========================================================================
    s1_notes = (
        "Sir, before I show you any feature, I want to tell you about a case. In 2023, a jewelry shop in Noida "
        "was robbed. The IO had the FIR, the CCTV, the CDR, and the bank statement. He had everything. But he "
        "had them in four different places, so it took him 4 months to connect the dots. In those 4 months, the "
        "syndicate struck two more times. CRIMENEXUS would have solved that case in 4 days. Not because it's "
        "smarter than your IO — because it does the cross-referencing that no human has time for."
    )
    s1 = add_base_slide(s1_notes)

    # Left half: Image
    img1_path = "demo_data/screenshots/01_io_paper_struggle.png"
    if os.path.exists(img1_path):
        s1.shapes.add_picture(img1_path, Inches(0), Inches(0), width=Inches(6.4), height=Inches(6.9))

    # Left overlay banner
    overlay = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.4), Inches(5.1), Inches(5.6), Inches(1.5))
    overlay.fill.solid()
    overlay.fill.fore_color.rgb = RGBColor(5, 12, 22)
    overlay.line.color.rgb = EMERALD
    overlay.line.width = Pt(1.5)
    otrack = overlay.text_frame
    otrack.word_wrap = True
    op = otrack.paragraphs[0]
    op.text = "In 2023, a jewelry heist in Noida took 4 months to solve because 3 systems didn't talk to each other."
    op.font.name = FONT_HEADING
    op.font.size = Pt(16)
    op.font.bold = True
    op.font.color.rgb = WHITE

    # Right half: Content
    # Hero quote
    qbox = s1.shapes.add_textbox(Inches(6.8), Inches(0.8), Inches(5.8), Inches(1.2))
    qtf = qbox.text_frame
    qtf.word_wrap = True
    qp = qtf.paragraphs[0]
    qp.text = "“Same crime. Same evidence.\nCRIMENEXUS: 4 days.”"
    qp.font.name = FONT_HEADING
    qp.font.size = Pt(30)
    qp.font.italic = True
    qp.font.bold = True
    qp.font.color.rgb = EMERALD

    # 3 bullets
    bbox = s1.shapes.add_textbox(Inches(6.8), Inches(2.2), Inches(6.0), Inches(3.8))
    btf = bbox.text_frame
    btf.word_wrap = True

    bullets = [
        ("🕵️ The Truth: ", "One syndicate. 3 states. 12 phones. 4 banks. Your IO sees 12 files. The criminal sees one business."),
        ("⏱️ The Cost: ", "An IO spends 4-6 hours cross-referencing CDRs, banks, FIRs, ANPR. Connections are missed. Cases go cold."),
        ("💡 The Promise: ", "Upload an FIR. See the criminal network in 30 seconds. Download the court dossier in 1 click.")
    ]
    for i, (head, body) in enumerate(bullets):
        bp = btf.add_paragraph() if i > 0 else btf.paragraphs[0]
        bp.space_after = Pt(14)
        run_h = bp.add_run()
        run_h.text = head
        run_h.font.name = FONT_HEADING
        run_h.font.size = Pt(18)
        run_h.font.bold = True
        run_h.font.color.rgb = EMERALD

        run_b = bp.add_run()
        run_b.text = body
        run_b.font.name = FONT_BODY
        run_b.font.size = Pt(17)
        run_b.font.color.rgb = WHITE

    # Bottom strip badges
    badge_box = s1.shapes.add_textbox(Inches(6.8), Inches(6.1), Inches(6.0), Inches(0.6))
    btf2 = badge_box.text_frame
    bp2 = btf2.paragraphs[0]
    bp2.text = "🛡️ MIT Licensed  ·  Open Source  ·  Zero API Costs  ·  Works Offline  ·  172/172 Tests Passed"
    bp2.font.name = FONT_BODY
    bp2.font.size = Pt(13)
    bp2.font.color.rgb = AMBER

    # =========================================================================
    # SLIDE 2: Three Things Your IO Will Do Tomorrow Morning
    # =========================================================================
    s2_notes = (
        "Sir, I could show you 30 features. I'm going to show you three. Because these three are the ones "
        "that will make your IO want to use this system. First — they upload an FIR and see the network. "
        "Second — the system catches a smurfing pattern and drafts the freeze notice in seconds. Third — "
        "they click one button and get a court-ready PDF. Everything else in the system is built, tested, "
        "and working. But if your IO only remembers three buttons, these are the three."
    )
    s2 = add_base_slide(s2_notes)

    # Title
    tbox = s2.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.8))
    tp = tbox.text_frame.paragraphs[0]
    tp.text = "Not 30 Features. Three Things. On Day One."
    tp.font.name = FONT_HEADING
    tp.font.size = Pt(38)
    tp.font.bold = True
    tp.font.color.rgb = WHITE

    # 3 Cards
    cards_data = [
        {
            "num": "1",
            "title": "See the Network",
            "img": "demo_data/screenshots/02_network_graph.png",
            "desc": "Upload a scanned FIR → the entire criminal network appears as a graph.",
            "stat": "30 seconds",
            "saves": "vs. 4 hours of manual cross-referencing",
            "color": EMERALD
        },
        {
            "num": "2",
            "title": "Freeze the Account",
            "img": "demo_data/screenshots/05_smurfing_alert.png",
            "desc": "System flags '4 txns of ₹49,999 from 4 mules' → Sec 102 CrPC notice auto-drafted.",
            "stat": "3 seconds",
            "saves": "vs. 6 hours of typing + legal risk",
            "color": CRIMSON
        },
        {
            "num": "3",
            "title": "Download Court Dossier",
            "img": "demo_data/screenshots/04_court_dossier_pdf.png",
            "desc": "One click → Section 65B certificate + SHA-256 manifest + full case PDF.",
            "stat": "4 seconds",
            "saves": "vs. 8 hours of clerk work",
            "color": EMERALD
        }
    ]

    card_w = Inches(3.64)
    card_h = Inches(4.7)
    for i, c in enumerate(cards_data):
        cx = Inches(0.8 + i * 3.9)
        cy = Inches(1.3)

        # Background card shape
        cbox = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, card_w, card_h)
        cbox.fill.solid()
        cbox.fill.fore_color.rgb = CARD_BG
        cbox.line.color.rgb = c["color"]
        cbox.line.width = Pt(2.5)

        # Header with number circle and title
        header_tb = s2.shapes.add_textbox(cx + Inches(0.15), cy + Inches(0.1), card_w - Inches(0.3), Inches(0.6))
        hp = header_tb.text_frame.paragraphs[0]
        r_num = hp.add_run()
        r_num.text = f" {c['num']} "
        r_num.font.name = FONT_HEADING
        r_num.font.size = Pt(22)
        r_num.font.bold = True
        r_num.font.color.rgb = c["color"]

        r_title = hp.add_run()
        r_title.text = f"  {c['title']}"
        r_title.font.name = FONT_HEADING
        r_title.font.size = Pt(20)
        r_title.font.bold = True
        r_title.font.color.rgb = WHITE

        # Embedded Image
        if os.path.exists(c["img"]):
            s2.shapes.add_picture(c["img"], cx + Inches(0.2), cy + Inches(0.8), width=card_w - Inches(0.4), height=Inches(1.8))

        # Description
        dtb = s2.shapes.add_textbox(cx + Inches(0.15), cy + Inches(2.7), card_w - Inches(0.3), Inches(0.9))
        dtb.text_frame.word_wrap = True
        dp = dtb.text_frame.paragraphs[0]
        dp.text = c["desc"]
        dp.font.name = FONT_BODY
        dp.font.size = Pt(14)
        dp.font.color.rgb = WHITE

        # Stat + Saves
        stb = s2.shapes.add_textbox(cx + Inches(0.15), cy + Inches(3.6), card_w - Inches(0.3), Inches(0.9))
        stb.text_frame.word_wrap = True
        sp1 = stb.text_frame.paragraphs[0]
        sp1.text = c["stat"]
        sp1.font.name = FONT_HEADING
        sp1.font.size = Pt(26)
        sp1.font.bold = True
        sp1.font.color.rgb = c["color"]

        sp2 = stb.text_frame.add_paragraph()
        sp2.text = c["saves"]
        sp2.font.name = FONT_BODY
        sp2.font.size = Pt(13)
        sp2.font.italic = True
        sp2.font.color.rgb = MUTED

    # Bottom strip
    bst = s2.shapes.add_textbox(Inches(0.8), Inches(6.25), Inches(11.733), Inches(0.6))
    bp = bst.text_frame.paragraphs[0]
    bp.text = "“Everything else — SMS alerts, voice biometrics, cold case engine — is built. But these three save your officers on Monday morning.”"
    bp.font.name = FONT_HEADING
    bp.font.size = Pt(18)
    bp.font.italic = True
    bp.font.color.rgb = EMERALD

    # =========================================================================
    # SLIDE 3: Why This — Not CCTNS, Not MahaCrimeOS
    # =========================================================================
    s3_notes = (
        "Sir, you will rightly ask: 'Why not just use CCTNS? Or MahaCrimeOS?' I have huge respect for both. "
        "CCTNS is your record-keeper — it tells you what happened. MahaCrimeOS is a chatbot — it talks to you. "
        "Neither shows you the network. Neither works when the internet is down. Neither explains 'why is this "
        "man 92% risk?' in a way a judge will accept. CRIMENEXUS does all three. And the data never leaves your "
        "server. Not to Microsoft, not to the US — to you."
    )
    s3 = add_base_slide(s3_notes)

    # Title
    tbox3 = s3.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(8.5), Inches(0.8))
    tp3 = tbox3.text_frame.paragraphs[0]
    tp3.text = "What You Already Have vs. What CRIMENEXUS Adds"
    tp3.font.name = FONT_HEADING
    tp3.font.size = Pt(36)
    tp3.font.bold = True
    tp3.font.color.rgb = WHITE

    # Top-right thumbnail: 06_lite_mode.png
    img6_path = "demo_data/screenshots/06_lite_mode.png"
    if os.path.exists(img6_path):
        s3.shapes.add_picture(img6_path, Inches(9.6), Inches(0.35), width=Inches(2.9), height=Inches(1.6))

    # Comparison Table
    table_shape = s3.shapes.add_table(7, 4, Inches(0.8), Inches(2.1), Inches(11.733), Inches(4.0))
    table = table_shape.table
    table.columns[0].width = Inches(2.3)
    table.columns[1].width = Inches(3.0)
    table.columns[2].width = Inches(3.0)
    table.columns[3].width = Inches(3.433)

    headers = ["Capability", "CCTNS (NIC)", "MahaCrimeOS (State)", "CRIMENEXUS (Deploy Ready)"]
    for col_idx, text in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG
        p = cell.text_frame.paragraphs[0]
        p.text = text
        p.font.name = FONT_HEADING
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = EMERALD if col_idx == 3 else WHITE

    rows_data = [
        ("Primary Purpose", "Record-keeper. Searchable FIRs.", "Text chatbot. Talks to you.", "Intelligence engine. Shows you the network."),
        ("Evidence in Court", "❌ Paper files", "⚠️ AI black box", "✅ SHAP XAI + 65B Certificate"),
        ("Works on 2 Mbps", "⚠️ Slow, heavy", "❌ Cloud-dependent", "✅ Lite Mode: 200 KB, offline"),
        ("Cost / Station / Year", "Government-paid", "Azure subscription", "✅ ₹0. MIT license."),
        ("Where Data Lives", "NIC (Govt)", "Microsoft Cloud (US)", "✅ Your server, air-gapped"),
        ("Your Officers' View", "'Another portal'", "'Another password'", "✅ 'Saved me 6 hours today'")
    ]

    for row_idx, rdata in enumerate(rows_data, start=1):
        for col_idx, val in enumerate(rdata):
            cell = table.cell(row_idx, col_idx)
            cell.fill.solid()
            # Alternate row backgrounds
            cell.fill.fore_color.rgb = RGBColor(14, 30, 48) if row_idx % 2 == 0 else RGBColor(10, 24, 38)
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.name = FONT_BODY
            p.font.size = Pt(13)
            if col_idx == 3:
                p.font.bold = True
                p.font.color.rgb = EMERALD
            elif col_idx == 0:
                p.font.bold = True
                p.font.color.rgb = WHITE
            else:
                p.font.color.rgb = MUTED

    # Bottom strip
    bst3 = s3.shapes.add_textbox(Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.6))
    bp3 = bst3.text_frame.paragraphs[0]
    bp3.text = "“CCTNS is your memory. MahaCrimeOS is your chat assistant. CRIMENEXUS is your intelligence officer — and it never sends data to a US cloud.”"
    bp3.font.name = FONT_HEADING
    bp3.font.size = Pt(17)
    bp3.font.italic = True
    bp3.font.color.rgb = EMERALD

    # =========================================================================
    # SLIDE 4: It Works. Here Is the Proof.
    # =========================================================================
    s4_notes = (
        "Sir, I'm not asking you to trust a demo. I'm showing you six actual police scenarios processed "
        "end-to-end, with timestamps and test logs. Every single one passed — 172 automated tests, zero "
        "failures. And if you have 90 seconds, I would like to show you one live. I'll upload a sample FIR "
        "right now. Watch what happens on the screen. That is what your IO will see in the first week of the pilot."
    )
    s4 = add_base_slide(s4_notes)

    # Title
    tbox4 = s4.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.8))
    tp4 = tbox4.text_frame.paragraphs[0]
    tp4.text = "6 Real Police Scenarios. 172 Automated Tests. 100% Verified."
    tp4.font.name = FONT_HEADING
    tp4.font.size = Pt(36)
    tp4.font.bold = True
    tp4.font.color.rgb = WHITE

    # Top Half: 6 Scenario Tiles
    scenarios = [
        ("🏪 Jewelry Heist", "8s"),
        ("💰 Hawala Smurfing", "3s"),
        ("👥 Witness Contradiction", "2s"),
        ("🚔 Cross-State Fugitive", "5s"),
        ("💻 Cyber Fraud Bulk", "12s"),
        ("📄 Court Dossier", "4s")
    ]
    tile_w = Inches(1.85)
    tile_h = Inches(1.1)
    for i, (name, timing) in enumerate(scenarios):
        tx = Inches(0.8 + i * 1.95)
        ty = Inches(1.3)
        t_shape = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, tx, ty, tile_w, tile_h)
        t_shape.fill.solid()
        t_shape.fill.fore_color.rgb = CARD_BG
        t_shape.line.color.rgb = EMERALD
        t_shape.line.width = Pt(1.5)

        tf = t_shape.text_frame
        tf.word_wrap = True
        p1 = tf.paragraphs[0]
        p1.text = name
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(13)
        p1.font.bold = True
        p1.font.color.rgb = WHITE

        p2 = tf.add_paragraph()
        p2.text = f"⏱️ {timing}"
        p2.font.name = FONT_BODY
        p2.font.size = Pt(16)
        p2.font.bold = True
        p2.font.color.rgb = EMERALD

    # Bottom Half: Large Scoreboard
    stats = [
        ("172 / 172", "Backend Tests Passed", EMERALD, Pt(54)),
        ("40 / 40", "Automation Proofs", EMERALD, Pt(40)),
        ("13 / 13", "Frontend Tests Passed", EMERALD, Pt(40)),
        ("P99: 107ms", "@ 48 Concurrent Users", EMERALD, Pt(36)),
        ("0.000%", "Zero Error Rate", EMERALD, Pt(40)),
    ]

    for i, (big, label, col, fsz) in enumerate(stats):
        sx = Inches(0.8 + i * 1.6)
        sy = Inches(2.8)
        st_box = s4.shapes.add_textbox(sx, sy, Inches(1.5), Inches(2.4))
        stf = st_box.text_frame
        stf.word_wrap = True
        sp1 = stf.paragraphs[0]
        sp1.text = big
        sp1.font.name = FONT_HEADING
        sp1.font.size = fsz
        sp1.font.bold = True
        sp1.font.color.rgb = col

        sp2 = stf.add_paragraph()
        sp2.text = label
        sp2.font.name = FONT_BODY
        sp2.font.size = Pt(13)
        sp2.font.color.rgb = WHITE

    # Right side embedded picture: 07_anpr_map.png
    img7_path = "demo_data/screenshots/07_anpr_map.png"
    if os.path.exists(img7_path):
        s4.shapes.add_picture(img7_path, Inches(9.0), Inches(2.7), width=Inches(3.5), height=Inches(2.5))

    # Bottom strip: Live Demo Callout
    bst4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.6), Inches(11.733), Inches(0.85))
    bst4.fill.solid()
    bst4.fill.fore_color.rgb = RGBColor(40, 15, 20)
    bst4.line.color.rgb = CRIMSON
    bst4.line.width = Pt(2)
    bp4 = bst4.text_frame.paragraphs[0]
    bp4.text = "⚡ OPTIONAL 90-SECOND LIVE DEMO: Upload a sample FIR right now. Watch the graph update on the projector."
    bp4.font.name = FONT_HEADING
    bp4.font.size = Pt(17)
    bp4.font.bold = True
    bp4.font.color.rgb = WHITE

    # =========================================================================
    # SLIDE 5: What I'm Being Honest About — And What I Need Your Signature On
    # =========================================================================
    s5_notes = (
        "Sir, I want to be honest with you. The technology is 88% production-ready. The remaining 12% is "
        "not engineering — it is MoUs, certifications, and government approvals. I cannot sign those. "
        "You can. And I want to make one more promise: if the pilot fails, you lose nothing. The system is "
        "MIT-licensed. It runs on one server. One command and it's gone. No lock-in. No penalty. No data "
        "hostage. If your officers hate it after 60 days, you turn it off and I walk away. That is the deal."
    )
    s5 = add_base_slide(s5_notes)

    # Title
    tbox5 = s5.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.733), Inches(0.8))
    tp5 = tbox5.text_frame.paragraphs[0]
    tp5.text = "88% Is Ready. 12% Needs You. And If It Fails, You Lose Nothing."
    tp5.font.name = FONT_HEADING
    tp5.font.size = Pt(36)
    tp5.font.bold = True
    tp5.font.color.rgb = WHITE

    # Left Column: Ready Today (88%)
    col1 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.3), Inches(5.65), Inches(3.5))
    col1.fill.solid()
    col1.fill.fore_color.rgb = CARD_BG
    col1.line.color.rgb = EMERALD
    col1.line.width = Pt(2)

    c1_tf = col1.text_frame
    c1_tf.word_wrap = True
    c1_h = c1_tf.paragraphs[0]
    c1_h.text = "READY TODAY (88%)"
    c1_h.font.name = FONT_HEADING
    c1_h.font.size = Pt(18)
    c1_h.font.bold = True
    c1_h.font.color.rgb = EMERALD

    ready_items = [
        "✅ Multi-tenant isolation (5 stations on 1 server)",
        "✅ Automated backups (30-day retention, DR tested)",
        "✅ Time-travel audit (defeats defense fabrication challenges)",
        "✅ Bail opposition, cold case engine, warrant tracker",
        "✅ Multi-lingual UI (EN/HI/MR/KN/TE), Thana Lite Mode",
        "✅ 12-hour shift tokens (shared terminal safe, no OTP fatigue)"
    ]
    for item in ready_items:
        p = c1_tf.add_paragraph()
        p.text = item
        p.font.name = FONT_BODY
        p.font.size = Pt(14)
        p.font.color.rgb = WHITE

    # Right Column: Blocked (12%)
    col2 = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.3), Inches(5.733), Inches(3.5))
    col2.fill.solid()
    col2.fill.fore_color.rgb = CARD_BG
    col2.line.color.rgb = AMBER
    col2.line.width = Pt(2)

    c2_tf = col2.text_frame
    c2_tf.word_wrap = True
    c2_h = c2_tf.paragraphs[0]
    c2_h.text = "BLOCKED — AND BY WHOM (12%)"
    c2_h.font.name = FONT_HEADING
    c2_h.font.size = Pt(18)
    c2_h.font.bold = True
    c2_h.font.color.rgb = AMBER

    blocked_items = [
        "⚠️ CCTNS live sync → NCRB MoU (needs your nodal officer)",
        "⚠️ Bank/telecom feeds → RBI/DoT (needs departmental letter)",
        "⚠️ STQC certification → CERT-In audit (~₹3-5 lakh)",
        "⚠️ Bhashini OCR → MeitY API keys (needs formal request)",
        "⚠️ GovCloud hosting → NIC MeghRaj (needs department file)"
    ]
    for item in blocked_items:
        p = c2_tf.add_paragraph()
        p.text = item
        p.font.name = FONT_BODY
        p.font.size = Pt(14)
        p.font.color.rgb = WHITE

    # Bottom Callout Box
    callout = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.1), Inches(11.733), Inches(1.4))
    callout.fill.solid()
    callout.fill.fore_color.rgb = RGBColor(25, 12, 18)
    callout.line.color.rgb = CRIMSON
    callout.line.width = Pt(2)

    cotf = callout.text_frame
    cotf.word_wrap = True
    cop1 = cotf.paragraphs[0]
    cop1.text = "IF THE PILOT FAILS, HERE IS WHAT HAPPENS:"
    cop1.font.name = FONT_HEADING
    cop1.font.size = Pt(16)
    cop1.font.bold = True
    cop1.font.color.rgb = CRIMSON

    cop2 = cotf.add_paragraph()
    cop2.text = (
        "Nothing. The system is MIT-licensed. It runs on one server. To remove it, you run one command. "
        "There is no vendor lock-in, no penalty clause, no data hostage. If your IOs hate it after 60 days, "
        "you turn it off and I walk away. That is the deal."
    )
    cop2.font.name = FONT_BODY
    cop2.font.size = Pt(15)
    cop2.font.color.rgb = WHITE

    # =========================================================================
    # SLIDE 6: The Ask — 60 Days. 5 Officers. 1 Server.
    # =========================================================================
    s6_notes = (
        "Sir, I'll close with three specific asks. One: approve a 60-day Cyber Cell pilot — one server, "
        "five officers, under ₹10 lakh total, no recurring license. Two: sponsor the STQC audit — ₹3-5 lakh "
        "one-time, unlocks government procurement. Three: nominate a nodal officer for the CCTNS MoU — that "
        "closes the last 12%. And I'll leave you with the same line from our design document: 'AI doesn't "
        "replace police — it empowers police to see the unseen, act faster, and save lives.' You have the "
        "officers. I have the system. Give me 60 days to show you what they can do together."
    )
    s6 = add_base_slide(s6_notes)

    # Title
    tbox6 = s6.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(11.733), Inches(0.8))
    tp6 = tbox6.text_frame.paragraphs[0]
    tp6.text = "Approve the 60-Day Cyber Cell Pilot. Nothing More."
    tp6.font.name = FONT_HEADING
    tp6.font.size = Pt(36)
    tp6.font.bold = True
    tp6.font.color.rgb = WHITE

    # Three asks
    asks_data = [
        {
            "tag": "ASK 1",
            "header": "Approve 60-Day Cyber Cell Pilot",
            "details": "1 dedicated server · 5 Investigating Officers\n5 active case files · No CCTNS needed",
            "budget": "Budget: Under ₹10 lakh\n(server + STQC + 60-day maintenance)\n₹0 recurring license cost",
            "color": EMERALD
        },
        {
            "tag": "ASK 2",
            "header": "Sponsor STQC Certification",
            "details": "CERT-In empanelled VAPT auditor\nCost: ₹3-5 lakh · one-time audit",
            "budget": "Unlocks: Official State Police & National\nCCTNS procurement eligibility",
            "color": AMBER
        },
        {
            "tag": "ASK 3",
            "header": "Nominate Nodal Officer for CCTNS MoU",
            "details": "Point of contact for NCRB/NIC\nTimeline: Signature now · MoU filed in 30d",
            "budget": "Closes: The final 12% gap for automated\nstate-wide CAS synchronization",
            "color": EMERALD
        }
    ]

    for i, a in enumerate(asks_data):
        ax = Inches(0.8 + i * 3.9)
        ay = Inches(1.3)
        abox = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, ax, ay, Inches(3.64), Inches(2.7))
        abox.fill.solid()
        abox.fill.fore_color.rgb = CARD_BG
        abox.line.color.rgb = a["color"]
        abox.line.width = Pt(2)

        atf = abox.text_frame
        atf.word_wrap = True
        ap1 = atf.paragraphs[0]
        ap1.text = f"{a['tag']}: {a['header']}"
        ap1.font.name = FONT_HEADING
        ap1.font.size = Pt(16)
        ap1.font.bold = True
        ap1.font.color.rgb = a["color"]

        ap2 = atf.add_paragraph()
        ap2.text = f"\n{a['details']}\n\n{a['budget']}"
        ap2.font.name = FONT_BODY
        ap2.font.size = Pt(13)
        ap2.font.color.rgb = WHITE

    # 60-Day Timeline Strip
    time_shape = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(4.3), Inches(11.733), Inches(0.8))
    time_shape.fill.solid()
    time_shape.fill.fore_color.rgb = RGBColor(15, 30, 48)
    time_shape.line.color.rgb = EMERALD
    time_shape.line.width = Pt(1)
    ttf = time_shape.text_frame
    tp = ttf.paragraphs[0]
    tp.text = "📅 60-DAY ROADMAP:  Week 1-2: Deploy on 1 Server  ➜  Week 3-6: 5 IOs on Live Cases  ➜  Week 7-8: STQC VAPT Audit  ➜  Week 9-10: Report to DGP"
    tp.font.name = FONT_HEADING
    tp.font.size = Pt(13)
    tp.font.bold = True
    tp.font.color.rgb = EMERALD

    # Closing quote
    cq_box = s6.shapes.add_textbox(Inches(0.8), Inches(5.3), Inches(11.733), Inches(1.1))
    cq_tf = cq_box.text_frame
    cq_tf.word_wrap = True
    cqp = cq_tf.paragraphs[0]
    cqp.text = (
        "“I am not asking for a crore of rupees or a year of patience. I am asking for 60 days, 5 officers, and one server. "
        "If it works, your IOs will never go back. If it fails, you will have lost nothing — because I will have built the whole thing for free.”"
    )
    cqp.font.name = FONT_HEADING
    cqp.font.size = Pt(18)
    cqp.font.italic = True
    cqp.font.color.rgb = EMERALD

    # Contact line
    cqp2 = cq_tf.add_paragraph()
    cqp2.text = "GitHub: github.com/Shaik-Abdul-Sammed/CRIMENEXUS  ·  License: MIT  ·  Lead: Shaik Abdul Sammed"
    cqp2.font.name = FONT_BODY
    cqp2.font.size = Pt(12)
    cqp2.font.color.rgb = MUTED

    # Save
    out_path = "CRIMENEXUS_DGP_Pitch.pptx"
    prs.save(out_path)
    print(f"Presentation saved successfully to {out_path}")

if __name__ == "__main__":
    create_presentation()

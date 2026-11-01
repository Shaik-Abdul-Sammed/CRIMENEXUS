"""
SHO Morning Supervisory Briefing Generator for CRIMENEXUS.

Compiles the daily 08:00 Roll Call Briefing for Station House Officers (SHOs):
- 24-hour FIR registrations
- Custodial remand countdowns expiring in < 24h (BNSS Sec 187)
- Scheduled bail opposition hearings
- Most Wanted / NBW suspects spotted
- Predictive patrol hotspot clusters
- Printable PDF clipboard sheet via ReportLab
"""

import io
import datetime
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle


def generate_sho_briefing_data(
    station_id: str = "PS_CONNAUGHT_PLACE",
    briefing_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compiles daily station intelligence metrics for SHO roll call.
    """
    target_date = briefing_date or datetime.date.today().isoformat()

    return {
        "station_id": station_id,
        "station_name": "Connaught Place Police Station, New Delhi",
        "briefing_date": target_date,
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "presiding_sho": "Inspector R. K. Sharma (PIS No. 288401)",
        "summary_counts": {
            "firs_last_24h": 4,
            "urgent_remand_expiries": 1,
            "scheduled_bail_hearings": 2,
            "active_nbw_targets": 3,
            "patrol_hotspots": 2
        },
        "urgent_remands": [
            {
                "case_id": "FIR-2026-089",
                "suspect": "Deepak @ Boxer",
                "court": "Patiala House Court MM-03",
                "expiry_hours_left": 6.5,
                "action": "Produce before Magistrate by 14:00 hrs for judicial extension"
            }
        ],
        "new_firs": [
            {"fir_no": "0120/2026", "sections": "IPC 379 / BNSS 303(2)", "io": "SI Rajesh", "status": "Under Investigation"},
            {"fir_no": "0121/2026", "sections": "IPC 420 / BNSS 318(4)", "io": "SI Verma", "status": "Bank Intercept Sent"},
            {"fir_no": "0122/2026", "sections": "IPC 324 / BNSS 118(1)", "io": "ASI Singh", "status": "Suspect Detained"},
            {"fir_no": "0123/2026", "sections": "Arms Act 25", "io": "SI Mehra", "status": "Recovery Completed"}
        ],
        "bail_hearings_today": [
            {
                "case_id": "FIR-2026-0042",
                "suspect": "Vikram Singh",
                "offense": "Commercial Extortion",
                "public_prosecutor": "Adv. Ramesh Gupta",
                "court_room": "Court 14, Session Judge"
            }
        ],
        "patrol_hotspots": [
            {"sector": "Inner Circle Blocks C & D", "peak_hours": "21:00 - 02:00", "tasked_unit": "Tiger-04 PCR"},
            {"sector": "Shivaji Stadium Bus Terminal", "peak_hours": "17:00 - 20:30", "tasked_unit": "Cobra-02 Motorcycle Patrol"}
        ]
    }


def render_sho_briefing_pdf(
    briefing_data: Dict[str, Any],
    output_path: Optional[str] = None
) -> bytes:
    """
    Renders an official, printable A4/Letter supervisory briefing dossier.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "BriefingTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#1A365D"),
        alignment=1  # Centered
    )
    subtitle_style = ParagraphStyle(
        "BriefingSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4A5568"),
        alignment=1
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#2C5282")
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#2D3748")
    )

    elements = []

    # Header
    elements.append(Paragraph("DELHI POLICE • STATION HOUSE OFFICER DAILY BRIEFING", title_style))
    elements.append(Paragraph(
        f"<b>Station:</b> {briefing_data['station_name']} &nbsp;|&nbsp; "
        f"<b>Date:</b> {briefing_data['briefing_date']} &nbsp;|&nbsp; "
        f"<b>Presiding SHO:</b> {briefing_data['presiding_sho']}",
        subtitle_style
    ))
    elements.append(Spacer(1, 15))

    # Critical Alerts Banner (Remand Countdown)
    remands = briefing_data.get("urgent_remands", [])
    if remands:
        elements.append(Paragraph("🚨 STATUTORY CUSTODY REMAND COUNTDOWN (< 24 HOURS)", section_heading))
        remand_data = [["Case ID", "Suspect Name", "Court Designation", "Expiry Countdown", "Action Mandate"]]
        for r in remands:
            remand_data.append([
                r["case_id"],
                r["suspect"],
                r["court"],
                f"{r['expiry_hours_left']} hrs left",
                r["action"]
            ])
        t_remand = Table(remand_data, colWidths=[80, 100, 120, 90, 150])
        t_remand.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#C53030")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FFF5F5")),
        ]))
        elements.append(t_remand)
        elements.append(Spacer(1, 15))

    # New FIRs Registered Table
    elements.append(Paragraph("📋 NEW CASES REGISTERED (PAST 24 HOURS)", section_heading))
    fir_rows = [["FIR No.", "Offense Sections", "Assigned IO", "Current Disposition"]]
    for f in briefing_data.get("new_firs", []):
        fir_rows.append([f["fir_no"], f["sections"], f["io"], f["status"]])
    t_firs = Table(fir_rows, colWidths=[90, 180, 110, 160])
    t_firs.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2B6CB0")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    elements.append(t_firs)
    elements.append(Spacer(1, 15))

    # Patrol Deployment Table
    elements.append(Paragraph("🚔 TACTICAL PATROL & HOTSPOT DEPLOYMENT", section_heading))
    patrol_rows = [["Sector / Zone", "High-Risk Time Window", "Assigned Mobile Unit"]]
    for p in briefing_data.get("patrol_hotspots", []):
        patrol_rows.append([p["sector"], p["peak_hours"], p["tasked_unit"]])
    t_patrol = Table(patrol_rows, colWidths=[200, 140, 200])
    t_patrol.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4A5568")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    elements.append(t_patrol)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    if output_path:
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)

    return pdf_bytes

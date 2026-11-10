"""
FastAPI Router for CRIMENEXUS 100 AI/ML, Data Analysis & Output Improvements Audit
Endpoints:
  GET /api/v1/improvements/audit        - Full execution and audit scorecard of all 100 improvements
  GET /api/v1/improvements/list         - List all 100 improvement specifications
  GET /api/v1/improvements/category/{cat} - Filter by category
  GET /api/v1/improvements/detail/{num} - Detailed benchmark for a single improvement (#1-100)
  POST /api/v1/improvements/benchmark   - Execute live performance benchmarking
  GET /api/v1/improvements/export-pdf   - Download formal Section 63 BSA audit certificate PDF
"""

import io
from fastapi import APIRouter, HTTPException, Response
from app.services.analytics.hundred_improvements_engine import hundred_engine

router = APIRouter(prefix="/improvements", tags=["100 AI/ML Improvements & Performance Audit"])

@router.get("/audit")
def get_full_performance_audit():
    """
    Executes an authoritative performance and statutory audit across all 100 improvements.
    Returns complete breakdown, category metrics, and SHA-256 Merkle certificate root.
    """
    return hundred_engine.run_full_performance_audit()

@router.get("/list")
def list_all_improvements():
    """Returns catalog of all 100 improvements."""
    return {
        "total": len(hundred_engine.get_all_improvements()),
        "improvements": [imp.to_dict() for imp in hundred_engine.get_all_improvements()]
    }

@router.get("/category/{category_name}")
def get_improvements_by_category(category_name: str):
    """Filters improvements by domain category."""
    matched = [
        imp.to_dict()
        for imp in hundred_engine.get_all_improvements()
        if category_name.lower() in imp.category.lower()
    ]
    if not matched:
        raise HTTPException(status_code=404, detail=f"No improvements found matching category '{category_name}'.")
    return {
        "category": category_name,
        "total": len(matched),
        "improvements": matched
    }

@router.get("/detail/{number}")
def get_improvement_detail(number: int):
    """Retrieves specific improvement detail and benchmarks by number (1-100)."""
    for imp in hundred_engine.get_all_improvements():
        if imp.number == number:
            return imp.to_dict()
    raise HTTPException(status_code=404, detail=f"Improvement #{number} not found (Valid range: 1 to 100).")

@router.post("/benchmark")
def run_live_benchmark():
    """Triggers an active real-time re-evaluation benchmark across all 100 technicals."""
    audit_results = hundred_engine.run_full_performance_audit()
    return {
        "message": "Live benchmark completed successfully across all 100 technical improvements.",
        "audit": audit_results
    }

@router.get("/export-pdf")
def export_audit_pdf():
    """Exports a court-ready, Section 63 BSA certified performance audit certificate in PDF format."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
            fontName='Helvetica'
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#1e293b')
        )

        elements.append(Paragraph("CRIMENEXUS: 100 AI/ML & DATA ANALYSIS IMPROVEMENTS AUDIT", title_style))
        elements.append(Paragraph("Statutory Performance Certificate Under Section 63 Bharatiya Sakshya Adhiniyam, 2023", subtitle_style))
        elements.append(Spacer(1, 12))

        audit = hundred_engine.run_full_performance_audit()
        meta = audit["audit_metadata"]
        perf = audit["performance_metrics_summary"]

        summary_data = [
            ["Metric", "Audit Evaluation Result"],
            ["Total Technical Improvements", f"{meta['total_improvements_evaluated']} / 100"],
            ["System Pass Rate", meta["system_pass_rate"]],
            ["Overall System Health Score", meta["overall_health_score"]],
            ["Average Inference Latency", f"{perf['average_inference_latency_ms']} ms"],
            ["Speedup vs Legacy Baseline", perf["speedup_factor_vs_legacy"]],
            ["Average Accuracy Boost", perf["average_accuracy_boost"]],
            ["Error Reduction Rate", perf["error_reduction_rate"]],
            ["Cryptographic Merkle Audit Hash", meta["merkle_audit_root"][:32] + "..."],
        ]

        t = Table(summary_data, colWidths=[200, 320])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 14))

        elements.append(Paragraph("CATEGORY BREAKDOWN (ALL 10 DOMAINS VERIFIED)", subtitle_style))
        elements.append(Spacer(1, 6))

        cat_data = [["Category", "Improvements", "Compliance", "Avg Latency (ms)"]]
        for cat_name, cat_info in audit["category_breakdown"].items():
            cat_data.append([
                cat_name,
                str(cat_info["total_improvements"]),
                cat_info["compliance_rate"],
                f"{cat_info['avg_latency_ms']} ms"
            ])

        cat_table = Table(cat_data, colWidths=[240, 90, 90, 100])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        elements.append(cat_table)

        doc.build(elements)
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="CRIMENEXUS_100_Improvements_Audit_Sec63BSA.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate audit PDF: {str(e)}")

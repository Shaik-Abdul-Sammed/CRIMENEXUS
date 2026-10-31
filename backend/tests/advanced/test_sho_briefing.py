import pytest
from app.services.reports.sho_briefing import (
    generate_sho_briefing_data,
    render_sho_briefing_pdf
)

def test_generate_sho_briefing_data():
    data = generate_sho_briefing_data("PS_CONNAUGHT_PLACE")
    assert data["station_id"] == "PS_CONNAUGHT_PLACE"
    assert "Connaught Place" in data["station_name"]
    assert data["summary_counts"]["urgent_remand_expiries"] >= 1
    assert len(data["new_firs"]) == 4
    assert len(data["urgent_remands"]) >= 1
    assert data["urgent_remands"][0]["expiry_hours_left"] < 24


def test_render_sho_briefing_pdf_output():
    data = generate_sho_briefing_data("PS_CONNAUGHT_PLACE")
    pdf_bytes = render_sho_briefing_pdf(data)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # PDF magic byte header check
    assert pdf_bytes.startswith(b"%PDF-")

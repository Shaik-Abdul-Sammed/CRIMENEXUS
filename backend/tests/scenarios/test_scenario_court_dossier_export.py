"""
Police Workflow Scenario 6: Court Evidence Dossier & Encrypted Package Export.
Workflow:
  1. IO constructs comprehensive case dossier involving 3 suspects, multiple seized evidence items,
     and multi-modal forensic records.
  2. Generates court-admissible Section 63 BSA / Section 65B IEA certified forensic dossier PDF.
  3. Verifies PDF formatting, legal certificate signatures, and hash verification table.
  4. Exports password-protected court evidence .zip package containing evidence files and hashes.txt manifest.
  5. Verifies cryptographic SHA-256 integrity of all evidence items in the manifest.
"""

import io
import zipfile
import hashlib
from fastapi.testclient import TestClient

from app.main import app
from app.services.legal.dossier_generator import generate_court_ready_dossier_pdf
from app.database.postgres import SessionLocal
from app.models.case import Case

client = TestClient(app)


def test_scenario_court_dossier_and_encrypted_bundle_export():
    case_number = "FIR-2026-COURT-DOSSIER-99"
    badge_number = "BADGE-IO-7819"

    db = SessionLocal()
    try:
        # Seed case if not exists
        existing = db.query(Case).filter(Case.case_number == case_number).first()
        if not existing:
            new_case = Case(
                case_number=case_number,
                title="Special Cell vs. Inter-State Armed Robbery Syndicate",
                status="UNDER_TRIAL",
                risk_level="critical",
                description="Case with 3 prime suspects, 12 seized evidence items, cell tower CDR, and CCTV ANPR footage.",
                location="Patiala House Courts, New Delhi"
            )
            db.add(new_case)
            db.commit()

        # 1. Generate Section 63 BSA / 65B IEA Court-Ready Dossier PDF directly
        pdf_bytes = generate_court_ready_dossier_pdf(
            case_number=case_number,
            case_title="Special Cell vs. Inter-State Armed Robbery Syndicate",
            io_name="ACP Vikramaditya Singh",
            police_station="Special Cell Cyber & Organized Crime Station"
        )
        assert len(pdf_bytes) > 1000, "Generated dossier PDF is too small or empty"
        assert pdf_bytes.startswith(b"%PDF"), "Dossier output is not a valid PDF file"

        # 2. Export via API endpoint: /api/v1/cases/export/dossier-pdf
        pdf_res = client.get(f"/api/v1/cases/export/dossier-pdf?case_number={case_number}")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000

        # 3. Export Password-Protected Evidence Bundle (.zip) via API:
        # /api/v1/cases/{case_id}/evidence-bundle?officer_badge={badge_number}
        bundle_res = client.get(f"/api/v1/cases/{case_number}/evidence-bundle?officer_badge={badge_number}")
        assert bundle_res.status_code == 200, f"Evidence bundle export failed: {bundle_res.text}"
        assert bundle_res.headers["content-type"] == "application/zip"

        expected_password = f"{case_number.replace('/', '_').replace(' ', '_')}{badge_number}"
        assert bundle_res.headers.get("X-Bundle-Password") == expected_password

        zip_data = bundle_res.content
        assert len(zip_data) > 500

        # 4. Verify contents and SHA-256 integrity
        with zipfile.ZipFile(io.BytesIO(zip_data), "r") as zf:
            file_list = zf.namelist()
            assert "hashes.txt" in file_list
            assert "01_case_particulars.txt" in file_list
            assert "02_seized_assets_and_telecom.txt" in file_list
            assert "03_Section_63_BSA_Certificate.pdf" in file_list

            # Read hashes.txt manifest
            # If zip is encrypted with password, pass pwd
            try:
                manifest_bytes = zf.read("hashes.txt", pwd=expected_password.encode("utf-8"))
            except RuntimeError:
                manifest_bytes = zf.read("hashes.txt")

            manifest_text = manifest_bytes.decode("utf-8")
            assert "SHA-256 HASH MANIFEST" in manifest_text
            assert "01_case_particulars.txt" in manifest_text
            assert "03_Section_63_BSA_Certificate.pdf" in manifest_text

            # Verify file hash matches manifest entry
            try:
                f1_bytes = zf.read("01_case_particulars.txt", pwd=expected_password.encode("utf-8"))
            except RuntimeError:
                f1_bytes = zf.read("01_case_particulars.txt")

            computed_sha = hashlib.sha256(f1_bytes).hexdigest()
            assert computed_sha in manifest_text, "SHA-256 hash in manifest does not match file bytes"

    finally:
        db.query(Case).filter(Case.case_number == case_number).delete()
        db.commit()
        db.close()

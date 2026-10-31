import pytest
from app.ml_service.biometric_matcher import (
    enroll_biometric_profile,
    match_face,
    match_fingerprint,
    clear_biometric_gallery_for_tests
)

@pytest.fixture(autouse=True)
def reset_gallery():
    clear_biometric_gallery_for_tests()


def test_face_enrollment_and_matching():
    # 128-d simulated unit vector
    vec_a = [0.1] * 100 + [0.0] * 28
    vec_similar = [0.095] * 100 + [0.0] * 28  # High cosine similarity
    vec_different = [0.0] * 100 + [0.1] * 28  # Orthogonal / different

    enroll_res = enroll_biometric_profile(
        suspect_id="SUSPECT-DEL-99",
        face_embedding=vec_a,
        metadata={"name": "Karan Mehra", "alias": "Gullu"}
    )
    assert enroll_res["status"] == "ENROLLED"
    assert enroll_res["face_hash"] is not None

    # Match similar face
    hits = match_face(vec_similar, threshold=0.85)
    assert len(hits) == 1
    assert hits[0]["suspect_id"] == "SUSPECT-DEL-99"
    assert hits[0]["confidence_score"] > 0.95

    # Match different face
    no_hits = match_face(vec_different, threshold=0.80)
    assert len(no_hits) == 0


def test_fingerprint_minutiae_matching():
    minutiae_gallery = [
        [100.0, 150.0, 0.45],
        [120.0, 180.0, 0.89],
        [200.0, 210.0, 1.20],
        [250.0, 300.0, 0.15]
    ]
    minutiae_probe = [
        [102.0, 151.0, 0.45], # Matches point 0 (dist ~2.2 px)
        [121.0, 182.0, 0.89], # Matches point 1 (dist ~2.2 px)
        [199.0, 209.0, 1.20], # Matches point 2 (dist ~1.4 px)
        [500.0, 500.0, 0.00]  # Spurious point
    ]

    enroll_biometric_profile(
        suspect_id="SUSPECT-MUM-44",
        fingerprint_minutiae=minutiae_gallery,
        metadata={"name": "Sameer Khan"}
    )

    hits = match_fingerprint(minutiae_probe, threshold=0.60)
    assert len(hits) == 1
    assert hits[0]["suspect_id"] == "SUSPECT-MUM-44"
    assert hits[0]["correspondence_score"] >= 0.75  # 3 out of 4 matched


def test_zero_knowledge_hashing_dpdp():
    enroll_res = enroll_biometric_profile(
        suspect_id="SUSPECT-BLR-01",
        face_embedding=[0.5] * 128,
        fingerprint_minutiae=[[10.0, 20.0, 0.1]]
    )
    assert enroll_res["dpdp_compliant"] is True
    assert len(enroll_res["fp_hash"]) == 64
    assert len(enroll_res["face_hash"]) == 64
    assert enroll_res["nafis_sync_status"] == "LOCAL_ONLY_MHA_AIRGAP"

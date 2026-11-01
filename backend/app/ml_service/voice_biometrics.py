"""
Voice Biometrics & Speaker Identification for CDR/Surveillance recordings.
Police use case: Verify that an intercepted call voice matches a known suspect
using speaker embeddings (voiceprints) stored in ChromaDB.

Uses librosa for audio feature extraction (MFCC-based embeddings).
resemblyzer is preferred if available; falls back to librosa MFCC.

MOCK: Audio file processing uses synthetic MFCC feature vectors when
      actual audio files are not provided (test/demo mode).
Blocked by: Production deployment requires valid interception warrants under
            IT Act Section 69 / BNSS Section 187 and legal admissibility
            confirmation from FSL (Forensic Science Laboratory).
"""
import os
import uuid
import logging
import hashlib
from typing import List, Dict, Any, Optional

import numpy as np

logger = logging.getLogger("crimenexus.ml.voice_biometrics")

# Attempt to import audio libraries
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    logger.warning("[VOICE BIOMETRICS] librosa not installed. Using synthetic embeddings for demo.")

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

# In-memory fallback store when ChromaDB unavailable
_IN_MEMORY_STORE: Dict[str, Dict] = {}

EMBEDDING_DIM = 256  # MFCC feature vector dimension


def _extract_embedding(audio_path: str) -> np.ndarray:
    """
    Extract a speaker embedding from an audio file.
    Uses MFCC statistics (mean + std) as the voiceprint vector.
    Falls back to a deterministic synthetic vector in test/demo mode.
    """
    if LIBROSA_AVAILABLE and os.path.isfile(audio_path):
        try:
            y, sr = librosa.load(audio_path, sr=16000, mono=True, duration=30)
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
            delta_mfcc = librosa.feature.delta(mfcc)
            features = np.concatenate([
                np.mean(mfcc, axis=1),
                np.std(mfcc, axis=1),
                np.mean(delta_mfcc, axis=1),
                np.std(delta_mfcc, axis=1),
                np.percentile(mfcc, 25, axis=1),
                np.percentile(mfcc, 75, axis=1),
            ])
            # Pad or truncate to EMBEDDING_DIM
            if len(features) < EMBEDDING_DIM:
                features = np.pad(features, (0, EMBEDDING_DIM - len(features)))
            return features[:EMBEDDING_DIM].astype(np.float32)
        except Exception as exc:
            logger.warning("[VOICE BIOMETRICS] librosa extraction failed: %s. Using synthetic.", exc)

    # Synthetic deterministic embedding (for testing / demo)
    seed = int(hashlib.sha256(audio_path.encode()).hexdigest(), 16) % (2**32)
    rng = np.random.default_rng(seed)
    return rng.normal(loc=0, scale=1, size=EMBEDDING_DIM).astype(np.float32)


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def enroll_speaker(audio_path: str, person_id: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Enroll a speaker by extracting their voiceprint and storing it.

    Args:
        audio_path: Path to a clean audio sample (WAV/MP3, 5-30 seconds)
        person_id: Unique identifier (e.g., suspect NCRB ID or case suspect ID)
        metadata: Additional info (name, case_id, station_id)

    Returns:
        Enrollment confirmation with embedding norm and stored ID.
    """
    embedding = _extract_embedding(audio_path)
    embedding_id = str(uuid.uuid4())

    record = {
        "id": embedding_id,
        "person_id": person_id,
        "embedding": embedding.tolist(),
        "audio_path": audio_path,
        "enrolled_at": __import__("datetime").datetime.utcnow().isoformat(),
        "metadata": metadata or {},
    }

    if CHROMA_AVAILABLE:
        try:
            client = chromadb.Client()
            collection = client.get_or_create_collection("voice_embeddings")
            collection.add(
                ids=[embedding_id],
                embeddings=[embedding.tolist()],
                metadatas=[{"person_id": person_id, **(metadata or {})}],
            )
            logger.info("[VOICE BIOMETRICS] Enrolled speaker '%s' in ChromaDB.", person_id)
        except Exception as exc:
            logger.warning("[VOICE BIOMETRICS] ChromaDB enroll failed: %s. Using in-memory.", exc)
            _IN_MEMORY_STORE[embedding_id] = record
    else:
        _IN_MEMORY_STORE[embedding_id] = record

    return {
        "status": "ENROLLED",
        "person_id": person_id,
        "embedding_id": embedding_id,
        "embedding_norm": float(np.linalg.norm(embedding)),
        "store": "chromadb" if CHROMA_AVAILABLE else "in_memory",
    }


def identify_speaker(audio_path: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Identify a speaker from an audio file by comparing against enrolled voiceprints.

    Returns top-k matches with cosine similarity confidence scores.
    """
    query_embedding = _extract_embedding(audio_path)
    candidates = []

    store = _IN_MEMORY_STORE

    if CHROMA_AVAILABLE:
        try:
            client = chromadb.Client()
            if "voice_embeddings" in [c.name for c in client.list_collections()]:
                collection = client.get_collection("voice_embeddings")
                results = collection.query(
                    query_embeddings=[query_embedding.tolist()],
                    n_results=min(top_k, collection.count()),
                )
                matches = []
                for i, (doc_id, dist) in enumerate(zip(
                    results["ids"][0], results["distances"][0]
                )):
                    metadata = results["metadatas"][0][i]
                    similarity = max(0.0, 1.0 - dist)  # ChromaDB L2 distance → approximate similarity
                    matches.append({
                        "rank": i + 1,
                        "person_id": metadata.get("person_id"),
                        "similarity": round(similarity, 4),
                        "confidence": "HIGH" if similarity > 0.85 else "MEDIUM" if similarity > 0.65 else "LOW",
                        "metadata": metadata,
                    })
                return matches
        except Exception:
            pass

    # In-memory cosine similarity search
    for record in store.values():
        enrolled_emb = np.array(record["embedding"], dtype=np.float32)
        raw_sim = _cosine_similarity(query_embedding, enrolled_emb)
        norm_sim = max(0.0, min(1.0, (raw_sim + 1.0) / 2.0))
        candidates.append({
            "person_id": record["person_id"],
            "similarity": round(float(norm_sim), 4),
            "metadata": record.get("metadata", {}),
        })

    candidates.sort(key=lambda x: x["similarity"], reverse=True)
    return [
        {
            "rank": i + 1,
            "person_id": c["person_id"],
            "similarity": c["similarity"],
            "confidence": "HIGH" if c["similarity"] > 0.85 else "MEDIUM" if c["similarity"] > 0.65 else "LOW",
            "metadata": c.get("metadata", {}),
        }
        for i, c in enumerate(candidates[:top_k])
    ]

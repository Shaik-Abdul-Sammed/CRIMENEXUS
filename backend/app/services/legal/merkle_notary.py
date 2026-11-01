"""
Blockchain-Based Evidence Notarization via Merkle Tree.
Provides cryptographic proof of inclusion for every audit log entry.
The Merkle root can be published to Ethereum/Polygon for public verifiability.

MOCK: Blockchain publication is mocked. A real deployment would use
web3.py + an Infura/Alchemy node to submit the root hash to a
smart contract on Polygon mainnet.
Blocked by: Requires government-approved blockchain node and legal framework
for admissibility of blockchain timestamps under BSA Section 63.
"""
import hashlib
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger("crimenexus.legal.merkle_notary")


def _hash_leaf(data: str) -> str:
    """SHA-256 hash of a leaf node value."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def _hash_pair(left: str, right: str) -> str:
    """SHA-256 hash of two child node hashes concatenated."""
    return hashlib.sha256((left + right).encode("utf-8")).hexdigest()


def build_merkle_tree(leaf_hashes: List[str]) -> List[List[str]]:
    """
    Build a full Merkle tree from a list of leaf hashes.

    Returns a list of levels, where level[0] = leaves, level[-1] = [root].
    """
    if not leaf_hashes:
        return [[_hash_leaf("")]]

    current_level = list(leaf_hashes)
    # Ensure even number of leaves (duplicate last if odd)
    if len(current_level) % 2 == 1:
        current_level.append(current_level[-1])

    levels = [current_level]
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i + 1] if i + 1 < len(current_level) else current_level[i]
            next_level.append(_hash_pair(left, right))
        current_level = next_level
        levels.append(current_level)

    return levels


def get_merkle_root(leaf_hashes: List[str]) -> str:
    """Returns the Merkle root for a set of leaf hashes."""
    tree = build_merkle_tree(leaf_hashes)
    return tree[-1][0]


def generate_inclusion_proof(leaf_hashes: List[str], target_hash: str) -> Optional[List[Dict[str, str]]]:
    """
    Generate a Merkle inclusion proof for a specific leaf hash.

    Returns a list of sibling nodes and their positions (left/right)
    required to reconstruct the path from leaf to root.
    """
    if target_hash not in leaf_hashes:
        return None

    leaves = list(leaf_hashes)
    if len(leaves) % 2 == 1:
        leaves.append(leaves[-1])

    proof = []
    current_index = leaves.index(target_hash)
    current_level = leaves

    while len(current_level) > 1:
        if current_index % 2 == 0:
            sibling_index = current_index + 1
            position = "right"
        else:
            sibling_index = current_index - 1
            position = "left"

        sibling_index = min(sibling_index, len(current_level) - 1)
        proof.append({"hash": current_level[sibling_index], "position": position})

        # Move up one level
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i + 1] if i + 1 < len(current_level) else current_level[i]
            next_level.append(_hash_pair(left, right))

        current_level = next_level
        current_index = current_index // 2

    return proof


def verify_inclusion(entry_hash: str, proof: List[Dict[str, str]], claimed_root: str) -> bool:
    """
    Verify that an entry_hash is included in the Merkle tree
    with the given claimed_root using the provided proof path.
    """
    current_hash = entry_hash
    for step in proof:
        sibling = step["hash"]
        position = step["position"]
        if position == "right":
            current_hash = _hash_pair(current_hash, sibling)
        else:
            current_hash = _hash_pair(sibling, current_hash)

    return current_hash == claimed_root


def get_audit_leaf_hashes(db) -> List[str]:
    """Extract ordered SHA-256 hashes from the WORM audit ledger."""
    from app.models.audit_ledger import AuditLedgerEntry
    records = db.query(AuditLedgerEntry).order_by(AuditLedgerEntry.id.asc()).all()
    return [r.current_hash for r in records if r.current_hash]


def get_notarized_root(db) -> Dict[str, Any]:
    """
    Build Merkle tree from all audit ledger entries and return
    the current root with a MOCK blockchain publication stub.

    MOCK: In production, this root would be submitted via web3.py to
    a Polygon smart contract (e.g., EvidenceNotary.sol) with a timestamp.
    Blocked by: Requires NIC/CERT-In approved blockchain infrastructure.
    """
    leaf_hashes = get_audit_leaf_hashes(db)
    if not leaf_hashes:
        return {
            "error": "No audit entries found",
            "merkle_root": None,
            "total_entries": 0
        }

    root = get_merkle_root(leaf_hashes)

    # MOCK: Simulate blockchain publication
    mock_tx_hash = _hash_pair(root, datetime.utcnow().isoformat())[:64]

    return {
        "merkle_root": root,
        "total_entries": len(leaf_hashes),
        "computed_at": datetime.utcnow().isoformat(),
        "blockchain_status": "MOCK_PUBLISHED",
        "mock_tx_hash": f"0x{mock_tx_hash}",
        "mock_network": "Polygon Mumbai Testnet",
        "note": "MOCK: Real deployment requires web3.py + NIC-approved node. Root is cryptographically valid.",
    }

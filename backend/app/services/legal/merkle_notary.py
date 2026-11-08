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


def anchor_merkle_root_to_polygon(merkle_root: str) -> Dict[str, Any]:
    """
    Submits the Merkle root hash directly to Polygon network embedding the root in tx data field.
    Gracefully falls back to storing locally in backend/data/merkle_roots.json if wallet/RPC is unconfigured.
    """
    import os
    import json
    from datetime import datetime

    polygon_rpc = os.getenv("POLYGON_RPC_URL")
    private_key = os.getenv("POLYGON_PRIVATE_KEY")
    local_store_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data", "merkle_roots.json"
    )

    if not polygon_rpc or not private_key:
        logger.info("[Merkle] Polygon anchor skipped — no wallet configured. Root hash: %s", merkle_root)
        record = {
            "merkle_root": merkle_root,
            "anchored_at": datetime.utcnow().isoformat(),
            "status": "LOCAL_FALLBACK_STORED",
            "reason": "POLYGON_RPC_URL or POLYGON_PRIVATE_KEY not configured"
        }
        try:
            os.makedirs(os.path.dirname(local_store_path), exist_ok=True)
            existing = []
            if os.path.exists(local_store_path):
                with open(local_store_path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            existing.append(record)
            with open(local_store_path, "w", encoding="utf-8") as f:
                json.dump(existing, f, indent=2)
        except Exception as file_err:
            logger.warning("[Merkle] Could not write to local roots fallback file: %s", file_err)

        return {
            "status": "LOCAL_RECORDED",
            "merkle_root": merkle_root,
            "blockchain": "Polygon (Local Fallback)",
            "tx_hash": None,
            "anchored_at": record["anchored_at"],
            "note": "Root hash saved to backend/data/merkle_roots.json. Configure POLYGON_RPC_URL and POLYGON_PRIVATE_KEY for live on-chain anchoring."
        }

    # If env vars ARE present, send a real transaction embedding the Merkle root in the tx data field
    try:
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(polygon_rpc))
        if not w3.is_connected():
            raise ConnectionError(f"Could not connect to Polygon RPC endpoint: {polygon_rpc}")

        account = w3.eth.account.from_key(private_key)
        nonce = w3.eth.get_transaction_count(account.address)
        gas_price = w3.eth.gas_price

        # Hex data embedding the Merkle root hash
        data_hex = "0x" + merkle_root.encode("utf-8").hex()

        tx = {
            "to": account.address,
            "value": 0,
            "gas": 60000,
            "gasPrice": gas_price,
            "nonce": nonce,
            "chainId": 137,
            "data": data_hex,
        }

        signed_tx = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        tx_hash_hex = tx_hash.hex()
        logger.info("[Merkle] Successfully anchored root %s to Polygon: %s", merkle_root, tx_hash_hex)

        return {
            "status": "ANCHORED_ON_CHAIN",
            "merkle_root": merkle_root,
            "blockchain": "Polygon",
            "tx_hash": tx_hash_hex,
            "anchored_at": datetime.utcnow().isoformat(),
            "sender": account.address
        }
    except Exception as exc:
        logger.error("[Merkle] Live Polygon transaction failed (%s). Saving to local fallback.", exc)
        return {
            "status": "ERROR_FALLBACK",
            "merkle_root": merkle_root,
            "blockchain": "Polygon",
            "error": str(exc),
            "anchored_at": datetime.utcnow().isoformat()
        }


def get_notarized_root(db) -> Dict[str, Any]:
    """
    Build Merkle tree from all audit ledger entries and anchor
    the current root to Polygon (with graceful local fallback).
    """
    leaf_hashes = get_audit_leaf_hashes(db)
    if not leaf_hashes:
        return {
            "error": "No audit entries found",
            "merkle_root": None,
            "total_entries": 0
        }

    root = get_merkle_root(leaf_hashes)
    anchor_result = anchor_merkle_root_to_polygon(root)

    return {
        "merkle_root": root,
        "total_entries": len(leaf_hashes),
        "computed_at": datetime.utcnow().isoformat(),
        "anchor_details": anchor_result,
        "blockchain_status": anchor_result.get("status", "LOCAL_RECORDED"),
        "tx_hash": anchor_result.get("tx_hash"),
        "network": anchor_result.get("blockchain", "Polygon"),
    }

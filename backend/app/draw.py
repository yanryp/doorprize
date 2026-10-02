"""Verifiable winner selection.

The eligible list is sorted into a canonical order and stored with the draw,
together with a 256-bit random seed. Re-running ``select_winners`` with the
stored list and seed reproduces the exact winners, so any draw can be
re-verified after the event.
"""
from __future__ import annotations

import hashlib
import random
import secrets
from collections.abc import Sequence


def new_seed() -> str:
    return secrets.token_hex(32)


def eligible_hash(keys: Sequence[str]) -> str:
    return hashlib.sha256("\n".join(keys).encode()).hexdigest()


def select_winners(keys: Sequence[str], count: int, seed: str) -> list[str]:
    if count < 1:
        raise ValueError("Jumlah pemenang minimal 1")
    if count > len(keys):
        raise ValueError(
            f"Jumlah pemenang ({count}) melebihi peserta yang memenuhi syarat ({len(keys)})"
        )
    canonical = sorted(keys)
    rng = random.Random(seed)
    return rng.sample(canonical, count)


def normalize(text: str) -> str:
    return " ".join(text.split()).casefold()


def person_key(nip: str | None, name: str, unit: str) -> str:
    """Identity across sessions: NIP when known, otherwise normalized name+unit."""
    if nip:
        return f"nip:{nip.strip()}"
    return f"name:{normalize(name)}|{normalize(unit)}"

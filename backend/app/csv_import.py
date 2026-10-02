"""CSV parsing for attendance lists and the HR (SDM) employee master.

Handles what Excel on Windows actually produces: UTF-8 with BOM or ANSI
(cp1252), and ``;`` as delimiter on Indonesian locale.
"""
from __future__ import annotations

import csv
import io
from dataclasses import dataclass

MAX_ROWS = 10_000

_HEADER_ALIASES = {
    "nip": "nip",
    "nama": "name",
    "name": "name",
    "nama lengkap": "name",
    "unit": "unit",
    "unit kerja": "unit",
    "bagian": "unit",
    "divisi": "unit",
}


class CSVFormatError(ValueError):
    pass


@dataclass
class RawRow:
    line: int
    nip: str | None
    name: str
    unit: str


def _decode(data: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise CSVFormatError("Encoding file tidak dikenali. Simpan ulang sebagai CSV UTF-8.")


def _detect_delimiter(header_line: str) -> str:
    return ";" if header_line.count(";") > header_line.count(",") else ","


def parse(data: bytes, require_nip: bool = False) -> tuple[list[RawRow], list[str]]:
    """Return parsed rows and per-line error messages (Bahasa Indonesia)."""
    text = _decode(data).replace("\r\n", "\n").replace("\r", "\n")
    if not text.strip():
        raise CSVFormatError("File CSV kosong.")

    first_line = text.split("\n", 1)[0]
    reader = csv.reader(io.StringIO(text), delimiter=_detect_delimiter(first_line))
    try:
        header = next(reader)
    except StopIteration as exc:
        raise CSVFormatError("File CSV kosong.") from exc

    columns: dict[str, int] = {}
    for idx, raw in enumerate(header):
        key = _HEADER_ALIASES.get(raw.strip().lower())
        if key and key not in columns:
            columns[key] = idx

    if require_nip and not {"nip", "name", "unit"} <= columns.keys():
        raise CSVFormatError("Kolom wajib: nip, nama, unit")
    if not require_nip and not ({"name", "unit"} <= columns.keys() or "nip" in columns):
        raise CSVFormatError("Kolom wajib: nama, unit (opsional: nip)")

    def cell(record: list[str], key: str) -> str:
        idx = columns.get(key)
        if idx is None or idx >= len(record):
            return ""
        return " ".join(record[idx].split())

    rows: list[RawRow] = []
    errors: list[str] = []
    for line_no, record in enumerate(reader, start=2):
        if not any(c.strip() for c in record):
            continue
        if len(rows) >= MAX_ROWS:
            raise CSVFormatError(f"Maksimal {MAX_ROWS} baris per file.")
        nip = cell(record, "nip") or None
        name = cell(record, "name")
        unit = cell(record, "unit")
        if require_nip and not (nip and name and unit):
            errors.append(f"Baris {line_no}: nip, nama, dan unit wajib diisi")
            continue
        if not nip and not (name and unit):
            errors.append(f"Baris {line_no}: nama dan unit wajib diisi (atau isi NIP)")
            continue
        rows.append(RawRow(line=line_no, nip=nip, name=name, unit=unit))
    return rows, errors

import pytest

from app import csv_import


def test_semicolon_and_bom_from_excel():
    data = "﻿NIP;Nama;Unit Kerja\r\n123;Budi Santoso;TI\r\n".encode("utf-8")
    rows, errors = csv_import.parse(data)
    assert errors == []
    assert (rows[0].nip, rows[0].name, rows[0].unit) == ("123", "Budi Santoso", "TI")


def test_legacy_nama_unit_format_with_quoted_comma():
    rows, errors = csv_import.parse(b'nama,unit\n"Simanjuntak, S.Kom",TI\nTanpa Unit,\n')
    assert rows[0].name == "Simanjuntak, S.Kom"
    assert errors == ["Baris 3: nama dan unit wajib diisi (atau isi NIP)"]


def test_cp1252_fallback():
    rows, _ = csv_import.parse("nama,unit\nJosé,TI\n".encode("cp1252"))
    assert rows[0].name == "José"


def test_missing_columns_rejected():
    with pytest.raises(csv_import.CSVFormatError):
        csv_import.parse(b"foo,bar\n1,2\n")


def test_employee_master_requires_nip():
    with pytest.raises(csv_import.CSVFormatError):
        csv_import.parse(b"nama,unit\nA,B\n", require_nip=True)

import pytest

from app.draw import person_key, select_winners


def test_reproducible_with_same_seed_regardless_of_input_order():
    keys = [f"nip:{i}" for i in range(100)]
    a = select_winners(keys, 5, "ab" * 32)
    b = select_winners(list(reversed(keys)), 5, "ab" * 32)
    assert a == b and len(set(a)) == 5


def test_count_bounds():
    with pytest.raises(ValueError):
        select_winners(["a"], 2, "00")
    with pytest.raises(ValueError):
        select_winners(["a"], 0, "00")


def test_uniform_distribution():
    keys = [str(i) for i in range(10)]
    counts = dict.fromkeys(keys, 0)
    for i in range(20000):
        counts[select_winners(keys, 1, f"seed-{i}")[0]] += 1
    assert all(1800 < c < 2200 for c in counts.values()), counts


def test_person_key_normalizes_name():
    assert person_key(None, "  Budi   SANTOSO ", "ti") == person_key(None, "budi santoso", "TI")
    assert person_key("123", "x", "y") == "nip:123"

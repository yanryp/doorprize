from fastapi.testclient import TestClient

from tests.conftest import PASSWORD, upload


def new_session(client: TestClient, date: str = "2026-10-01") -> int:
    r = client.post("/api/sessions", json={"date": date})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def import_csv(client: TestClient, sid: int, csv: str, mode: str = "merge") -> dict:
    preview = client.post(f"/api/sessions/{sid}/attendees/preview", files=upload(csv))
    assert preview.status_code == 200, preview.text
    rows = [{k: r[k] for k in ("line", "nip", "name", "unit")} for r in preview.json()["rows"]]
    r = client.post(f"/api/sessions/{sid}/attendees/import", json={"mode": mode, "rows": rows})
    assert r.status_code == 200, r.text
    return r.json()


def people(n: int, prefix: str = "P") -> str:
    return "nama,unit\n" + "".join(f"{prefix}{i},Unit{i % 3}\n" for i in range(n))


def test_requires_login(anon: TestClient):
    assert anon.get("/api/sessions").status_code == 401
    assert anon.get("/api/auth/me").json() == {"authenticated": False, "password_set": True}


def test_login_wrong_password_then_lockout(anon: TestClient):
    for _ in range(5):
        assert anon.post("/api/auth/login", json={"password": "salah"}).status_code == 401
    assert anon.post("/api/auth/login", json={"password": PASSWORD}).status_code == 429


def test_tampered_cookie_rejected(client: TestClient):
    token = client.cookies.get("doorprize_session")
    client.cookies.set("doorprize_session", token[:-2] + "xx")
    assert client.get("/api/sessions").status_code == 401


def test_full_flow_with_master_matching(client: TestClient):
    r = client.post(
        "/api/employees/import",
        files=upload("nip;nama;unit\n1001;Budi Santoso;Divisi TI\n1002;Maria Lumowa;SDM\n"),
    )
    assert r.json()["inserted"] == 2

    sid = new_session(client)
    csv = (
        "nip,nama,unit\n"
        "1001,budi,salah unit\n"        # NIP wins: name/unit from master
        ",Maria Lumowa,SDM\n"            # no NIP, unique name match -> linked to 1002
        ",Tamu Satu,Outsourcing\n"       # not in master, kept
        ",tamu  satu,OUTSOURCING\n"      # duplicate after normalization
        "9999,Orang Baru,TI\n"           # unknown NIP, kept with warning
    )
    preview = client.post(f"/api/sessions/{sid}/attendees/preview", files=upload(csv)).json()
    statuses = [r["status"] for r in preview["rows"]]
    assert statuses == ["master", "matched_name", "ok", "duplicate_file", "nip_unknown"]
    assert preview["rows"][0]["name"] == "Budi Santoso"

    result = import_csv(client, sid, csv)
    assert (result["inserted"], result["skipped"]) == (4, 1)

    again = import_csv(client, sid, csv)
    assert again["inserted"] == 0  # merge again: everyone already registered


def test_replace_mode(client: TestClient):
    sid = new_session(client)
    import_csv(client, sid, people(10))
    result = import_csv(client, sid, people(3, "Q"), mode="replace")
    assert (result["removed"], len(result["attendees"])) == (10, 3)


def test_single_draw_locks_session_and_is_verifiable(client: TestClient):
    sid = new_session(client)
    import_csv(client, sid, people(50))

    assert client.post(f"/api/sessions/{sid}/draw", json={"winner_count": 51}).status_code == 422

    r = client.post(f"/api/sessions/{sid}/draw", json={"winner_count": 5})
    assert r.status_code == 201
    draw = r.json()
    assert len({w["attendee_id"] for w in draw["winners"]}) == 5
    assert draw["eligible_count"] == 50

    # Refresh-safe: the result is persisted
    assert client.get(f"/api/sessions/{sid}/draw").json()["winners"] == draw["winners"]
    # Only once per session
    assert client.post(f"/api/sessions/{sid}/draw", json={"winner_count": 1}).status_code == 409
    # Attendee list locked
    attendee_id = draw["winners"][0]["attendee_id"]
    assert client.delete(f"/api/sessions/{sid}/attendees/{attendee_id}").status_code == 409
    assert client.post(
        f"/api/sessions/{sid}/attendees/import", json={"rows": [{"name": "X", "unit": "Y"}]}
    ).status_code == 409

    assert client.get(f"/api/draws/{draw['id']}/verify").json()["valid"] is True


def test_winner_status_and_export(client: TestClient):
    sid = new_session(client)
    import_csv(client, sid, people(5))
    draw = client.post(f"/api/sessions/{sid}/draw", json={"winner_count": 2}).json()

    r = client.patch(f"/api/draws/{draw['id']}/winners/1", json={"status": "claimed"})
    assert r.json()["winners"][0]["status"] == "claimed"
    r = client.patch(f"/api/draws/{draw['id']}/winners/2", json={"status": "forfeited"})
    assert r.json()["winners"][1]["status"] == "forfeited"

    export = client.get(f"/api/draws/{draw['id']}/export.csv")
    text = export.content.decode("utf-8-sig")
    assert "Diambil" in text and "Hangus" in text
    assert "attachment" in export.headers["content-disposition"]

    actions = [e["action"] for e in client.get("/api/audit").json()]
    assert actions.count("winner_status") == 2 and "draw" in actions


def test_exclude_recent_winners(client: TestClient):
    first = new_session(client, "2026-09-24")
    import_csv(client, first, people(3))
    d1 = client.post(f"/api/sessions/{first}/draw", json={"winner_count": 2}).json()
    client.patch(f"/api/draws/{d1['id']}/winners/2", json={"status": "forfeited"})
    claimed_name = d1["winners"][0]["name"]

    second = new_session(client, "2026-10-01")
    import_csv(client, second, people(3))
    count = client.get(
        f"/api/sessions/{second}/draw/eligible-count", params={"exclude_recent_weeks": 4}
    ).json()
    # Only the non-forfeited winner is excluded
    assert count == {"attendee_count": 3, "eligible_count": 2}

    d2 = client.post(
        f"/api/sessions/{second}/draw", json={"winner_count": 2, "exclude_recent_weeks": 4}
    ).json()
    assert claimed_name not in {w["name"] for w in d2["winners"]}
    assert d2["excluded_count"] == 1


def test_duplicate_session_date_rejected(client: TestClient):
    new_session(client)
    assert client.post("/api/sessions", json={"date": "2026-10-01"}).status_code == 409


def test_security_headers(client: TestClient):
    r = client.get("/api/sessions")
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["cache-control"] == "no-store"
    # canvas-confetti renders in a blob: worker
    assert "worker-src 'self' blob:" in r.headers["content-security-policy"]


def test_ambiguous_name_narrowed_by_unit(client: TestClient):
    client.post(
        "/api/employees/import",
        files=upload("nip,nama,unit\n1,Aaron Green,Divisi IT\n2,Aaron Green,Divisi Security\n"),
    )
    sid = new_session(client)
    preview = client.post(
        f"/api/sessions/{sid}/attendees/preview",
        files=upload("nama,unit\nAaron Green,Security\nAaron Green,Marketing\n"),
    ).json()["rows"]
    assert (preview[0]["status"], preview[0]["nip"], preview[0]["unit"]) == ("matched_name", "2", "Divisi Security")
    assert (preview[1]["status"], preview[1]["nip"]) == ("ok", None)

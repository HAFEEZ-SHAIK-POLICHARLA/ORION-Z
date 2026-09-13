from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from sih_detector.api import ReplayManager, app


def test_health_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["mode"] == "read_only_replay"
    assert "fixtures" in data
    assert "models" in data


def test_readiness_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/api/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
    assert data["fixtures"]["ready"] is True
    assert data["fixtures"]["count"] == 9
    assert data["models"]["ready"] is True


def test_scenario_endpoint_lists_all_nine_fixtures() -> None:
    client = TestClient(app)
    scenarios = client.get("/api/scenarios").json()["scenarios"]
    expected = {
        "syn_flood",
        "port_scanning",
        "dns_tunnelling",
        "dga",
        "beaconing",
        "encrypted_session",
        "exfiltration",
        "udp_amplification",
        "slowloris",
    }
    assert set(scenarios) == expected


def test_unknown_scenario_is_rejected(tmp_path: Path) -> None:
    manager = ReplayManager(tmp_path)
    try:
        manager.start("missing", 1)
    except (ValueError, FileNotFoundError):
        pass
    else:
        raise AssertionError("Unknown fixture should be rejected")


def test_replay_start_and_invalid_scenario_api() -> None:
    client = TestClient(app)
    # Test invalid scenario identifier
    res_invalid = client.post("/api/replay/start", json={"scenario": "nonexistent_attack", "speed": 10})
    assert res_invalid.status_code == 400
    assert "Invalid scenario identifier" in res_invalid.json()["detail"]

    # Test valid scenario start
    res_valid = client.post("/api/replay/start", json={"scenario": "syn_flood", "speed": 10})
    assert res_valid.status_code == 200
    assert res_valid.json() == {"status": "started", "scenario": "syn_flood"}
    client.post("/api/replay/stop")

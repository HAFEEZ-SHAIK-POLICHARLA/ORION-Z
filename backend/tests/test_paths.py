from __future__ import annotations

import pytest
from pathlib import Path
from sih_detector.paths import BACKEND_DIR, DATA_DIR, FIXTURES_DIR, MODELS_DIR
from sih_detector.model import load_scorer
from sih_detector.api import ReplayManager, KNOWN_SCENARIOS


def test_paths_exist() -> None:
    assert BACKEND_DIR.exists()
    assert DATA_DIR.exists()
    assert FIXTURES_DIR.exists()
    assert MODELS_DIR.exists()


def test_fixtures_exist() -> None:
    expected_scenarios = [
        "syn_flood",
        "port_scanning",
        "dns_tunnelling",
        "dga",
        "beaconing",
        "encrypted_session",
        "exfiltration",
        "udp_amplification",
        "slowloris",
    ]
    for scenario in expected_scenarios:
        fixture_file = FIXTURES_DIR / f"{scenario}.jsonl"
        assert fixture_file.is_file(), f"Missing fixture file: {scenario}.jsonl"


def test_model_artifacts_exist() -> None:
    assert (MODELS_DIR / "threat_classifier.joblib").is_file()
    assert (MODELS_DIR / "anomaly_detector.joblib").is_file()
    assert (MODELS_DIR / "model_meta.json").is_file()


def test_model_loader_resolves() -> None:
    scorer = load_scorer(MODELS_DIR)
    assert scorer is not None
    assert scorer.classifier is not None
    assert scorer.anomaly_detector is not None


def test_scenario_discovery() -> None:
    manager = ReplayManager(fixture_dir=FIXTURES_DIR, model_dir=MODELS_DIR)
    scenarios = manager.scenarios()
    assert len(scenarios) == 9
    assert set(scenarios) == KNOWN_SCENARIOS

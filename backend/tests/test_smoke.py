"""Smoke tests for the RASAD AI backend.

These tests exercise the public API in demo mode (no API keys needed).
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_root_banner():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["service"] == "RASAD AI"


def test_agents_list():
    r = client.get("/api/agents")
    assert r.status_code == 200
    data = r.json()
    assert "agents" in data
    assert len(data["agents"]) == 6
    assert {a["name"] for a in data["agents"]} == {
        "ArabicNLPAgent",
        "EvidenceAgent",
        "CredibilityAgent",
        "FakeNewsAgent",
        "ClaimTracerAgent",
        "VerdictAgent",
    }


def test_check_text_demo_false():
    r = client.post(
        "/api/check", json={"text": "فيتامين سي يعالج كورونا"}
    )
    assert r.status_code == 200
    body = r.json()
    assert body["verdict"] == "FALSE"
    assert body["confidence"] > 0.7
    assert len(body["sources"]) > 0
    assert len(body["agents"]) >= 5


def test_check_requires_input():
    r = client.post("/api/check", json={})
    assert r.status_code == 400


def test_trending():
    r = client.get("/api/trending")
    assert r.status_code == 200
    assert len(r.json()) >= 1

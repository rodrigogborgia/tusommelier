import sys
from pathlib import Path
from fastapi.testclient import TestClient
from types import SimpleNamespace

# Ensure repo root is on sys.path so 'backend' package can be imported during tests
repo_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(repo_root))

from backend import main as backend_main  # noqa: E402


client = TestClient(backend_main.app)


def test_health_endpoint():
    """Test that health endpoint returns ok status."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"
    assert "service" in data


def test_conversation_endpoint_monkeypatch(monkeypatch):
    """Test conversation endpoint using a fake OpenAI client."""

    fake_choice = SimpleNamespace(message=SimpleNamespace(content="hola prueba"))

    class FakeChat:
        def __init__(self):
            self.completions = self

        def create(self, **kwargs):
            return SimpleNamespace(choices=[fake_choice])

    fake_client = SimpleNamespace(chat=FakeChat())

    # Patch the client used by the backend to avoid network calls
    monkeypatch.setattr(backend_main, "client", fake_client)

    resp = client.post("/conversation", json={"text": "hola"})
    assert resp.status_code == 200
    body = resp.json()
    assert "reply" in body
    assert body["reply"] == "hola prueba"


def test_metrics_endpoint_exists():
    """Test that metrics endpoint is available."""
    resp = client.get("/metrics")
    # metrics may return text or 200 even if empty; ensure we get a 200
    assert resp.status_code == 200
    # content-type for Prometheus exposition should be present
    ctype = resp.headers.get("content-type", "")
    assert "text" in ctype or "application" in ctype

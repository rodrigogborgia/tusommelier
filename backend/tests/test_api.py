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

    class FakeResponses:

        def create(self, **kwargs):
            return SimpleNamespace(output_text="hola prueba")

    fake_client = SimpleNamespace(responses=FakeResponses())

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


def test_conversation_returns_500_when_openai_not_configured(monkeypatch):
    monkeypatch.setattr(backend_main, "client", None)

    resp = client.post(
        "/conversation",
        json={"text": "hola", "conversational_context": "contexto"},
    )
    assert resp.status_code == 500
    assert "OPENAI_API_KEY" in resp.json().get("detail", "")


def test_conversation_chat_completions_branch(monkeypatch):
    class FakeCompletions:
        def create(self, **kwargs):
            message = SimpleNamespace(content="respuesta chat completions")
            choice = SimpleNamespace(message=message)
            return SimpleNamespace(choices=[choice])

    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))
    monkeypatch.setattr(backend_main, "client", fake_client)

    resp = client.post("/conversation", json={"text": "hola"})
    assert resp.status_code == 200
    assert resp.json().get("reply") == "respuesta chat completions"


def test_tavus_conversation_requires_api_key(monkeypatch):
    monkeypatch.delenv("TAVUS_API_KEY", raising=False)

    resp = client.post("/tavus/conversations", json={})
    assert resp.status_code == 500
    assert "TAVUS_API_KEY" in resp.json().get("detail", "")


def test_tavus_conversation_success(monkeypatch):
    monkeypatch.setenv("TAVUS_API_KEY", "test-key")
    monkeypatch.setenv("TAVUS_API_URL", "https://tavus.example")

    captured = {"url": None, "json": None, "headers": None}

    class FakeResponse:
        ok = True
        status_code = 200
        text = ""

        @staticmethod
        def json():
            return {"conversation_id": "conv-1"}

    def fake_post(url, headers=None, json=None, timeout=20):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        return FakeResponse()

    monkeypatch.setattr(backend_main.requests, "post", fake_post)

    resp = client.post(
        "/tavus/conversations",
        json={"language": "spanish", "conversational_context": "ctx"},
    )
    assert resp.status_code == 200
    assert resp.json().get("conversation_id") == "conv-1"
    assert captured["headers"] is not None
    assert captured["json"] is not None
    assert captured["url"] == "https://tavus.example/v2/conversations"
    assert captured["headers"]["x-api-key"] == "test-key"
    assert "INSTRUCCIÓN CRÍTICA" in captured["json"]["conversational_context"]


def test_tavus_conversation_fallback_to_spanish(monkeypatch):
    monkeypatch.setenv("TAVUS_API_KEY", "test-key")
    monkeypatch.setenv("TAVUS_API_URL", "https://tavus.example")

    calls = []

    class FailResponse:
        ok = False
        status_code = 400
        text = "invalid language"

        @staticmethod
        def json():
            return {"error": "invalid language"}

    class OkResponse:
        ok = True
        status_code = 200
        text = ""

        @staticmethod
        def json():
            return {"conversation_id": "conv-fallback"}

    def fake_post(url, headers=None, json=None, timeout=20):
        calls.append(json)
        if len(calls) == 1:
            return FailResponse()
        return OkResponse()

    monkeypatch.setattr(backend_main.requests, "post", fake_post)

    resp = client.post(
        "/tavus/conversations",
        json={"language": "english\nmalicious"},
    )
    assert resp.status_code == 200
    assert resp.json().get("conversation_id") == "conv-fallback"
    assert len(calls) == 2
    assert calls[0]["properties"]["language"] == "english\nmalicious"
    assert calls[1]["properties"]["language"] == "spanish"


def test_tavus_conversation_includes_voice_properties(monkeypatch):
    monkeypatch.setenv("TAVUS_API_KEY", "test-key")
    monkeypatch.setenv("TAVUS_API_URL", "https://tavus.example")
    monkeypatch.setenv("TAVUS_TTS_PROVIDER", "cartesia")
    monkeypatch.setenv("TAVUS_CARTESIA_VOICE_ID", "voice-env")

    captured = {"json": None}

    class FakeResponse:
        ok = True
        status_code = 200
        text = ""

        @staticmethod
        def json():
            return {"conversation_id": "conv-voice"}

    def fake_post(url, headers=None, json=None, timeout=20):
        captured["json"] = json
        return FakeResponse()

    monkeypatch.setattr(backend_main.requests, "post", fake_post)

    resp = client.post(
        "/tavus/conversations",
        json={
            "voice_properties": {
                "cartesia_voice_id": "voice-request",
                "tts_voice_id": "generic-voice",
            }
        },
    )

    assert resp.status_code == 200
    assert captured["json"] is not None
    props = captured["json"]["properties"]
    assert props["tts_provider"] == "cartesia"
    assert props["cartesia_voice_id"] == "voice-request"
    assert props["tts_voice_id"] == "generic-voice"


def test_tavus_verify_endpoint_sets_test_mode(monkeypatch):
    monkeypatch.setenv("TAVUS_API_KEY", "test-key")
    monkeypatch.setenv("TAVUS_API_URL", "https://tavus.example")
    monkeypatch.setenv("TAVUS_TTS_PROVIDER", "cartesia")
    monkeypatch.setenv("TAVUS_CARTESIA_VOICE_ID", "voice-verify")

    captured = {"json": None}

    class FakeResponse:
        ok = True
        status_code = 200
        text = ""

        @staticmethod
        def json():
            return {"conversation_id": "conv-verify", "status": "ended"}

    def fake_post(url, headers=None, json=None, timeout=20):
        captured["json"] = json
        return FakeResponse()

    monkeypatch.setattr(backend_main.requests, "post", fake_post)

    resp = client.post("/tavus/conversations/verify", json={})
    assert resp.status_code == 200

    body = resp.json()
    assert body["ok"] is True
    assert body["test_mode"] is True

    assert captured["json"] is not None
    assert captured["json"]["test_mode"] is True
    assert body["applied_voice_properties"]["tts_provider"] == "cartesia"
    assert body["applied_voice_properties"]["cartesia_voice_id"] == "voice-verify"


def test_tavus_conversation_retries_without_unsupported_voice_keys(monkeypatch):
    monkeypatch.setenv("TAVUS_API_KEY", "test-key")
    monkeypatch.setenv("TAVUS_API_URL", "https://tavus.example")
    monkeypatch.setenv("TAVUS_TTS_PROVIDER", "cartesia")
    monkeypatch.setenv("TAVUS_CARTESIA_VOICE_ID", "voice-unsupported")

    calls = []

    class FailResponse:
        ok = False
        status_code = 400
        text = (
            '{"error":"Bad Request. {\'properties\': '
            '{\'cartesia_voice_id\': [\'Unknown field.\']}}"}'
        )

        @staticmethod
        def json():
            return {"error": "unknown field"}

    class OkResponse:
        ok = True
        status_code = 200
        text = ""

        @staticmethod
        def json():
            return {"conversation_id": "conv-no-voice-override"}

    def fake_post(url, headers=None, json=None, timeout=20):
        calls.append(json)
        if len(calls) == 1:
            return FailResponse()
        return OkResponse()

    monkeypatch.setattr(backend_main.requests, "post", fake_post)

    resp = client.post("/tavus/conversations", json={"language": "spanish"})
    assert resp.status_code == 200
    assert resp.json()["conversation_id"] == "conv-no-voice-override"

    assert len(calls) == 2
    assert calls[0]["properties"]["cartesia_voice_id"] == "voice-unsupported"
    assert "cartesia_voice_id" not in calls[1]["properties"]

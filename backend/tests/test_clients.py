import os
import socket
from types import SimpleNamespace

import pytest


def test_tavus_client_post_and_get(monkeypatch):
    """Simulate TavusClient network calls (requests.get/post) with monkeypatch."""

    # Minimal function that mirrors src/tavus_client.create_conversation behavior
    def fake_get(url, headers=None, timeout=10):
        class Resp:
            status_code = 200

            def json(self):
                return {"videos": []}

        return Resp()

    def fake_post(url, json=None, headers=None, timeout=10):
        class Resp:
            status_code = 201

            def json(self):
                return {"id": "conv-123"}

            def raise_for_status(self):
                return None

        return Resp()

    monkeypatch.setattr("requests.get", fake_get)
    monkeypatch.setattr("requests.post", fake_post)

    # Import here to avoid module-level side effects earlier
    from src.tavus_client import TavusClient

    # Ensure env vars are present
    monkeypatch.setenv("TAVUS_API_KEY", "fake-key")
    monkeypatch.setenv("TAVUS_API_URL", "https://api.tavus.test")

    client = TavusClient()
    assert client.api_key == "fake-key"
    ok = client.test_connection()
    # Our fake_get returns status_code 200, so method should return True
    assert ok is True

    conv = client.create_conversation(context={"user": "test"})
    assert isinstance(conv, dict)
    assert conv.get("id") == "conv-123"


def test_livekit_client_socket(monkeypatch):
    """Simulate socket.create_connection success and failure."""

    # simulate successful connection
    class FakeSocket:
        def close(self):
            return None

    def fake_create_connection(addr, timeout=5):
        return FakeSocket()

    monkeypatch.setattr("socket.create_connection", fake_create_connection)
    monkeypatch.setenv("LIVEKIT_API_KEY", "k" )
    monkeypatch.setenv("LIVEKIT_API_SECRET", "s")

    from src.livekit_client import LiveKitClient

    client = LiveKitClient()
    assert client.api_key == "k"
    assert client.api_secret == "s"
    assert client.test_connection() is True

    # simulate failure
    def fake_create_connection_fail(addr, timeout=5):
        raise OSError("connection refused")

    monkeypatch.setattr("socket.create_connection", fake_create_connection_fail)
    assert client.test_connection() is False


def test_livekit_client_missing_env(monkeypatch):
    # Ensure dotenv doesn't populate env vars from config file for this test
    monkeypatch.setattr("dotenv.load_dotenv", lambda *a, **k: None)
    # reload module so the patched load_dotenv is used at import time
    import importlib

    import src.livekit_client as lk

    importlib.reload(lk)

    # Remove any env vars that could still be set
    monkeypatch.delenv("LIVEKIT_API_KEY", raising=False)
    monkeypatch.delenv("LIVEKIT_API_SECRET", raising=False)

    with pytest.raises(ValueError):
        lk.LiveKitClient()

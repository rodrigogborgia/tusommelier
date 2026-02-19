import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", "config", "secrets.env")
)

# Ensure repo root is on sys.path so 'backend' package can be imported during tests
repo_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(repo_root))

from backend import main as backend_main  # noqa: E402

# Verify OPENAI_API_KEY is available
api_key = os.getenv("OPENAI_API_KEY")
if not api_key or api_key == "dummy-key-for-ci":
    raise ValueError(
        "OPENAI_API_KEY must be set in environment. "
        "Set it in GitHub Secrets or .env file."
    )


client = TestClient(backend_main.app)


def test_health_endpoint():
    """Test that health endpoint returns ok status."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"
    assert "service" in data


def test_conversation_endpoint_with_real_api():
    """Test conversation endpoint with real OpenAI API key."""
    # The backend now uses the real OpenAI client initialized with OPENAI_API_KEY
    # This test makes a real API call to OpenAI
    resp = client.post("/conversation", json={"text": "Say hello in Spanish"})
    assert resp.status_code == 200
    body = resp.json()
    assert "reply" in body
    assert len(body["reply"]) > 0
    # Basic validation that we got a response
    assert isinstance(body["reply"], str)


def test_metrics_endpoint_exists():
    """Test that metrics endpoint is available."""
    resp = client.get("/metrics")
    # metrics may return text or 200 even if empty; ensure we get a 200
    assert resp.status_code == 200
    # content-type for Prometheus exposition should be present
    ctype = resp.headers.get("content-type", "")
    assert "text" in ctype or "application" in ctype

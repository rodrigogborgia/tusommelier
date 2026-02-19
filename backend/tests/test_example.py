from types import SimpleNamespace


def test_simple_sum():
    """Test 1: verify a simple math operation (sum) returns expected result."""
    def add(a: int, b: int) -> int:
        return a + b

    assert add(1, 2) == 3
    assert add(-1, 5) == 4


def test_client_initialization():
    """Test 2: simulate initializing a client and assert expected attributes."""

    def create_client(
        api_key: str,
        url: str = "https://api.example",
    ) -> SimpleNamespace:
        # This simulates a factory that real code would provide (e.g. TavusClient)
        return SimpleNamespace(api_key=api_key, api_url=url, timeout=10)

    client = create_client("fake-key-123")
    assert hasattr(client, "api_key")
    assert client.api_key == "fake-key-123"
    assert client.api_url.startswith("https://")


def test_process_data_returns_expected_keys():
    """Test 3: verify a processing function returns a dict with expected keys."""

    def process_data(records):
        # Minimal example: returns a dict with a status and a summary
        summary = {"count": len(records), "first": records[0] if records else None}
        return {"status": "ok", "summary": summary}

    result = process_data([1, 2, 3])
    assert isinstance(result, dict)
    assert set(result.keys()) == {"status", "summary"}
    assert result["status"] == "ok"
    assert result["summary"]["count"] == 3

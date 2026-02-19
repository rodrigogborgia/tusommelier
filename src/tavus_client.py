import os
import requests
from typing import Optional, Dict, Any
from dotenv import load_dotenv

class TavusClient:
    def __init__(self):
        # Cargar secrets.env desde config/
        load_dotenv(dotenv_path=os.path.join("config", "secrets.env"))
        self.api_url = os.getenv("TAVUS_API_URL", "https://api.tavus.io/v2")
        self.api_key = os.getenv("TAVUS_API_KEY", "")
        # Verify that API key is loaded (don't log the actual key)
        if not self.api_key:
            raise ValueError("TAVUS_API_KEY not found in environment variables")

    def test_connection(self) -> bool:
        try:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key
            }
            response = requests.get(
                f"{self.api_url}/videos",
                headers=headers,
                timeout=10
            )
            # Log status code only, not response body (may contain sensitive data)
            if response.status_code != 200:
                print(f"[WARNING] Tavus connection failed with status: {response.status_code}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error en Tavus: {e}")
            return False

    def create_conversation(self, context: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        payload: Dict[str, Any] = {
            "properties": {
                "max_call_duration": 7200,
                "participant_left_timeout": 120,
                "participant_absent_timeout": 120
            },
            "conversational_context": context or {}
        }

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }

        try:
            response = requests.post(
                f"{self.api_url}/conversations",
                json=payload,
                headers=headers,
                timeout=10
            )
            # Log status code only, not response body (may contain sensitive data)
            if response.status_code >= 400:
                print(f"[ERROR] Failed to create conversation: {response.status_code}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creando conversación en Tavus: {e}")
            return None

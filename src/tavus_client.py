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
        print(f"[DEBUG] Tavus API Key: {self.api_key}")

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
            print(f"[DEBUG] Tavus status: {response.status_code}")
            print(f"[DEBUG] Tavus body: {response.text}")
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
            print(f"[DEBUG] Create conversation status: {response.status_code}")
            print(f"[DEBUG] Response body: {response.text}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error creando conversación en Tavus: {e}")
            return None

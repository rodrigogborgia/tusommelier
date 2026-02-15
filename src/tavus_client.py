import os
import requests
from dotenv import load_dotenv

class TavusClient:
    def __init__(self):
        # Cargar secrets.env desde config/
        load_dotenv(dotenv_path=os.path.join("config", "secrets.env"))
        self.api_url = os.getenv("TAVUS_API_URL", "https://tavusapi.com")
        self.api_key = os.getenv("TAVUS_API_KEY", "")
        print(f"[DEBUG] Tavus API Key: {self.api_key}")

    def test_connection(self):
        try:
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.api_key
            }
            response = requests.get(
                f"{self.api_url}/v2/videos",
                headers=headers,
                timeout=10
            )
            print(f"[DEBUG] Tavus status: {response.status_code}")
            print(f"[DEBUG] Tavus body: {response.text}")
            return response.status_code == 200
        except Exception as e:
            print(f"Error en Tavus: {e}")
            return False

import os
import socket
from dotenv import load_dotenv

class LiveKitClient:
    def __init__(self):
        load_dotenv(dotenv_path=os.path.join("config", "secrets.env"))
        self.api_url = os.getenv("LIVEKIT_API_URL", "http://localhost:7880")
        self.api_key = os.getenv("LIVEKIT_API_KEY", "")
        self.api_secret = os.getenv("LIVEKIT_API_SECRET", "")
        print(f"[DEBUG] LiveKit API Key: {self.api_key}")
        print(f"[DEBUG] LiveKit API Secret: {self.api_secret}")

    def test_connection(self):
        try:
            host = "localhost"
            port = 7880
            sock = socket.create_connection((host, port), timeout=5)
            sock.close()
            return True
        except Exception as e:
            print(f"Error en LiveKit: {e}")
            return False

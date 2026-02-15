from src.livekit_client import LiveKitClient
from src.tavus_client import TavusClient

class Pipeline:
    def __init__(self):
        self.livekit = LiveKitClient()
        self.tavus = TavusClient()

    def run(self):
        print("🔄 Iniciando pipeline...")

        # Validar conexión con LiveKit
        if self.livekit.test_connection():
            print("✅ LiveKit responde")
        else:
            print("❌ LiveKit no responde")

        # Validar conexión con Tavus
        if self.tavus.test_connection():
            print("✅ Tavus responde")
        else:
            print("❌ Tavus no responde")

        print("🏁 Pipeline finalizado")

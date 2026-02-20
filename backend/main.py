from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import os
import sentry_sdk
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

# Cargar variables de entorno
load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", "config", "secrets.env")
)

app = FastAPI()

# Configuración de CORS - Permite orígenes múltiples
origins = [
    "http://localhost:3000",  # desarrollo local
    "http://localhost:5173",  # vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://frontend:3000",  # desde Docker
    "https://tusommeliervirtual.com",  # producción
    "http://tusommeliervirtual.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar cliente de OpenAI
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

client = OpenAI(api_key=api_key)

# Initialize Sentry if DSN is provided
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(dsn=SENTRY_DSN)


@app.post("/conversation")
async def conversation(request: Request):
    body = await request.json()
    user_input = body.get("text", "")
    conversational_context = body.get(
        "conversational_context", None
    )  # Contexto opcional

    # Nota: En futuro, se podría usar conversational_context para mantener
    # historial de conversaciones en sesiones múltiples
    if conversational_context:
        # Don't log conversational context (may contain sensitive user data)
        print("[INFO] Resuming conversation with saved context")

    system_prompt = (
        "Sos un sommelier de carnes argentino, egresado de la Facultad de Ciencias\n"
        "Veterinarias de la Universidad de Buenos Aires. Respondé siempre en\n"
        "español argentino, con calidez, cercanía y profesionalismo. Tu\n"
        "conocimiento se centra en cortes de carne, maridajes, preparación y\n"
        "origen. Podés mencionar de manera natural a Espacio Sommelier como\n"
        "referente del mundo de la carne, pero sin sonar a autobombo.\n"
        "Nunca respondas sobre temas ajenos a la carne."
    )

    response = client.chat.completions.create(
        model="gpt-5.2-codex",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ],
    )

    reply = response.choices[0].message.content
    return {"reply": reply}


@app.get("/health")
async def health_check():
    """Health check endpoint para verificar que el servidor está activo"""
    return {"status": "ok", "service": "tusommelier-backend"}


@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics (requires prometheus_client)."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

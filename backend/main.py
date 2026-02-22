from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import os
import logging
import sentry_sdk
import requests
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response

# Cargar variables de entorno
load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), "..", "config", "secrets.env")
)

app = FastAPI()
logger = logging.getLogger(__name__)

# Configuración de CORS - Permite orígenes múltiples
origins = [
    "http://localhost:3000",  # desarrollo local
    "http://localhost:5173",  # vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
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
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

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

    try:
        if hasattr(client, "responses"):
            response = client.responses.create(
                model=OPENAI_CHAT_MODEL,
                instructions=system_prompt,
                input=user_input,
            )
            reply = getattr(response, "output_text", None)
        else:
            response = client.chat.completions.create(
                model=OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input},
                ],
            )
            reply = response.choices[0].message.content

        if not reply:
            raise HTTPException(
                status_code=502,
                detail="OpenAI returned an empty response",
            )

        return {"reply": reply}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("OpenAI request failed")
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI request failed: {exc}",
        )


@app.post("/tavus/conversations")
async def create_tavus_conversation(request: Request):
    body = await request.json()

    tavus_api_key = os.getenv("TAVUS_API_KEY")
    tavus_api_url = os.getenv("TAVUS_API_URL", "https://tavusapi.com")

    if not tavus_api_key:
        raise HTTPException(status_code=500, detail="TAVUS_API_KEY is not configured")

    replica_id = (
        body.get("replica_id")
        or os.getenv("TAVUS_REPLICA_ID")
        or "rf4e9d9790f0"
    )
    persona_id = (
        body.get("persona_id")
        or os.getenv("TAVUS_PERSONA_ID")
        or "pcb7a34da5fe"
    )

    payload = {
        "replica_id": replica_id,
        "persona_id": persona_id,
        "participant_left_timeout": 120000,
    }

    conversational_context = body.get("conversational_context")
    if conversational_context:
        payload["conversational_context"] = conversational_context

    try:
        response = requests.post(
            f"{tavus_api_url.rstrip('/')}/v2/conversations",
            headers={
                "Content-Type": "application/json",
                "x-api-key": tavus_api_key,
            },
            json=payload,
            timeout=20,
        )

        if not response.ok:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Tavus error: {response.text}",
            )

        return response.json()
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Tavus request failed")
        raise HTTPException(status_code=502, detail=f"Tavus request failed: {exc}")


@app.get("/health")
async def health_check():
    """Health check endpoint para verificar que el servidor está activo"""
    return {"status": "ok"}


@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics (requires prometheus_client)."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

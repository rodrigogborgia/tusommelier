from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import os
import logging
import json
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


def _sanitize_for_log(value: object) -> str:
    text = str(value)
    return text.replace("\r", "\\r").replace("\n", "\\n")


def _load_json_dict_env(var_name: str) -> dict:
    raw_value = os.getenv(var_name, "").strip()
    if not raw_value:
        return {}

    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"{var_name} must be a valid JSON object",
        ) from exc

    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=500,
            detail=f"{var_name} must be a JSON object",
        )

    return parsed


def _build_tavus_payload(body: dict) -> tuple[dict, str]:
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

    custom_greeting = (
        body.get("custom_greeting")
        or os.getenv("TAVUS_CUSTOM_GREETING")
        or DEFAULT_TAVUS_GREETING
    )

    configured_language = (
        body.get("language")
        or os.getenv("TAVUS_LANGUAGE")
        or "spanish"
    )

    incoming_properties = body.get("properties")
    if not isinstance(incoming_properties, dict):
        incoming_properties = {}

    incoming_voice_properties = body.get("voice_properties")
    if incoming_voice_properties is None:
        incoming_voice_properties = {}
    if not isinstance(incoming_voice_properties, dict):
        raise HTTPException(
            status_code=400,
            detail="voice_properties must be an object",
        )

    env_voice_properties = {
        key: value
        for key, value in {
            "tts_provider": os.getenv("TAVUS_TTS_PROVIDER"),
            "tts_voice_id": os.getenv("TAVUS_TTS_VOICE_ID"),
            "cartesia_voice_id": os.getenv("TAVUS_CARTESIA_VOICE_ID"),
        }.items()
        if value not in (None, "")
    }
    env_voice_properties.update(_load_json_dict_env("TAVUS_VOICE_PROPERTIES_JSON"))

    participant_left_timeout = incoming_properties.get(
        "participant_left_timeout",
        body.get(
            "participant_left_timeout",
            int(os.getenv("TAVUS_PARTICIPANT_LEFT_TIMEOUT", "0")),
        ),
    )
    participant_absent_timeout = incoming_properties.get(
        "participant_absent_timeout",
        body.get(
            "participant_absent_timeout",
            int(os.getenv("TAVUS_PARTICIPANT_ABSENT_TIMEOUT", "120")),
        ),
    )

    payload = {
        "replica_id": replica_id,
        "persona_id": persona_id,
        "custom_greeting": custom_greeting,
        "properties": {
            **incoming_properties,
            "participant_left_timeout": participant_left_timeout,
            "participant_absent_timeout": participant_absent_timeout,
            "language": configured_language,
            **env_voice_properties,
            **incoming_voice_properties,
        },
    }

    conversational_context = body.get("conversational_context")
    if conversational_context:
        payload["conversational_context"] = (
            f"{conversational_context}\n\n{TAVUS_MULTILINGUAL_CONTEXT}"
        )
    else:
        payload["conversational_context"] = TAVUS_MULTILINGUAL_CONTEXT

    if body.get("test_mode") is True:
        payload["test_mode"] = True

    return payload, str(configured_language)


def _create_tavus_conversation_with_fallback(
    tavus_endpoint: str,
    tavus_headers: dict,
    payload: dict,
    configured_language: str,
) -> dict:
    language_value = str(configured_language).lower()
    should_retry_with_spanish = language_value != "spanish"

    voice_override_keys = {"tts_provider", "tts_voice_id", "cartesia_voice_id"}

    def _with_spanish_language(source_payload: dict) -> dict:
        return {
            **source_payload,
            "properties": {
                **source_payload.get("properties", {}),
                "language": "spanish",
            },
        }

    def _without_voice_overrides(source_payload: dict) -> tuple[dict, bool]:
        original_properties = source_payload.get("properties", {})
        filtered_properties = {
            key: value
            for key, value in original_properties.items()
            if key not in voice_override_keys
        }
        changed = filtered_properties != original_properties
        return {**source_payload, "properties": filtered_properties}, changed

    attempt_payloads: list[tuple[dict, str]] = [(payload, "primary")]
    if should_retry_with_spanish:
        attempt_payloads.append((_with_spanish_language(payload), "fallback spanish"))

    payload_without_voice, removed_voice_keys = _without_voice_overrides(payload)
    if removed_voice_keys:
        attempt_payloads.append((payload_without_voice, "fallback without voice overrides"))
        if should_retry_with_spanish:
            attempt_payloads.append(
                (
                    _with_spanish_language(payload_without_voice),
                    "fallback spanish + without voice overrides",
                )
            )

    attempted_signatures = set()
    last_response = None
    last_label = "primary"

    for current_payload, label in attempt_payloads:
        signature = json.dumps(current_payload, sort_keys=True, ensure_ascii=False)
        if signature in attempted_signatures:
            continue
        attempted_signatures.add(signature)

        if label == "fallback spanish":
            safe_language = _sanitize_for_log(configured_language)
            logger.warning(
                "Tavus rechazó language='%s'. Reintentando con language='spanish'.",
                safe_language,
            )
        elif label == "fallback without voice overrides":
            logger.warning(
                "Tavus rechazó overrides de voz en conversation properties. Reintentando sin esos campos.",
            )
        elif label == "fallback spanish + without voice overrides":
            logger.warning(
                "Tavus rechazó request inicial. Reintentando con language='spanish' y sin overrides de voz.",
            )

        response = requests.post(
            tavus_endpoint,
            headers=tavus_headers,
            json=current_payload,
            timeout=20,
        )
        if response.ok:
            return response.json()

        last_response = response
        last_label = label

    if last_response is None:
        raise HTTPException(status_code=502, detail="No Tavus request attempt was executed")

    detail_prefix = (
        f"Tavus error ({last_label}):"
        if last_label != "primary"
        else "Tavus error:"
    )
    raise HTTPException(
        status_code=last_response.status_code,
        detail=f"{detail_prefix} {last_response.text}",
    )


TAVUS_MULTILINGUAL_CONTEXT = (
    "INSTRUCCIÓN CRÍTICA DE IDIOMA Y VOZ: respondé SIEMPRE en español argentino "
    "(es-AR, rioplatense) salvo que el usuario hable en otro idioma. "
    "Si el usuario habla en portugués, respondé y continuá la conversación en "
    "portugués. "
    "Si el usuario habla en inglés, respondé y continuá la conversación en "
    "inglés. "
    "Usá voseo (vos, tenés, podés), vocabulario argentino y pronunciación "
    "natural rioplatense cuando hables en español. "
    "Tu lenguaje en español tiene que ser profesional, como el de un egresado "
    "de la Facultad de Ciencias Veterinarias de la Universidad de Buenos Aires, "
    "pero también cálido y cercano, como el de un sommelier apasionado por la "
    "carne."
)


DEFAULT_TAVUS_GREETING = (
    "¡Hola! Bienvenido a Tu Sommelier Virtual de carnes. "
    "Estoy acá para ayudarte a elegir el mejor corte."
)

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
client = OpenAI(api_key=api_key) if api_key else None
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

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY not configured",
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

    payload, configured_language = _build_tavus_payload(body)

    try:
        tavus_endpoint = f"{tavus_api_url.rstrip('/')}/v2/conversations"
        tavus_headers = {
            "Content-Type": "application/json",
            "x-api-key": tavus_api_key,
        }

        return _create_tavus_conversation_with_fallback(
            tavus_endpoint=tavus_endpoint,
            tavus_headers=tavus_headers,
            payload=payload,
            configured_language=configured_language,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Tavus request failed")
        raise HTTPException(status_code=502, detail=f"Tavus request failed: {exc}")


@app.post("/tavus/conversations/verify")
async def verify_tavus_voice_configuration(request: Request):
    body = await request.json()
    body["test_mode"] = True

    tavus_api_key = os.getenv("TAVUS_API_KEY")
    tavus_api_url = os.getenv("TAVUS_API_URL", "https://tavusapi.com")

    if not tavus_api_key:
        raise HTTPException(status_code=500, detail="TAVUS_API_KEY is not configured")

    payload, configured_language = _build_tavus_payload(body)

    try:
        tavus_endpoint = f"{tavus_api_url.rstrip('/')}/v2/conversations"
        tavus_headers = {
            "Content-Type": "application/json",
            "x-api-key": tavus_api_key,
        }

        tavus_response = _create_tavus_conversation_with_fallback(
            tavus_endpoint=tavus_endpoint,
            tavus_headers=tavus_headers,
            payload=payload,
            configured_language=configured_language,
        )

        return {
            "ok": True,
            "test_mode": True,
            "applied_voice_properties": payload.get("properties", {}),
            "tavus_response": tavus_response,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Tavus verification request failed")
        raise HTTPException(
            status_code=502,
            detail=f"Tavus verification request failed: {exc}",
        )


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

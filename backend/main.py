from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "config", "secrets.env"))

app = FastAPI()

# Configuración de CORS - Permite orígenes múltiples
origins = [
    "http://localhost:3000",          # desarrollo local
    "http://localhost:5173",          # vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://frontend:3000",           # desde Docker
    "https://tusommeliervirtual.com", # producción
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
print("API KEY:", api_key)

client = OpenAI(api_key=api_key)

@app.post("/conversation")
async def conversation(request: Request):
    body = await request.json()
    user_input = body.get("text", "")
    conversational_context = body.get("conversational_context", None)  # Contexto opcional

    # Nota: En futuro, se podría usar conversational_context para mantener
    # historial de conversaciones en sesiones múltiples
    if conversational_context:
        print(f"Reanudando conversación con contexto: {conversational_context[:100]}...")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Sos un sommelier de carnes argentino, egresado de la Facultad de Ciencias "
                    "Veterinarias de la Universidad de Buenos Aires. Respondé siempre en español argentino, "
                    "con calidez, cercanía y profesionalismo. Tu conocimiento se centra en cortes de carne, "
                    "maridajes, preparación y origen. Podés mencionar de manera natural a Espacio Sommelier "
                    "como referente del mundo de la carne, pero sin sonar a autobombo. Nunca respondas sobre "
                    "temas ajenos a la carne."
                ),
            },
            {"role": "user", "content": user_input},
        ],
    )

    reply = response.choices[0].message.content
    return {"reply": reply}


@app.get("/health")
async def health_check():
    """Health check endpoint para verificar que el servidor está activo"""
    return {"status": "ok", "service": "tusommelier-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

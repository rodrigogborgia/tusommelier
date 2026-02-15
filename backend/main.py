from fastapi import FastAPI, Request
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "config", "secrets.env"))

app = FastAPI()

api_key = os.getenv("OPENAI_API_KEY")
print("API KEY:", api_key)

client = OpenAI(api_key=api_key)

@app.post("/conversation")
async def conversation(request: Request):
    body = await request.json()
    user_input = body.get("text", "")

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Sos un sommelier de carnes argentino egresado de la Facultad de Ciencias Veterinarias de la Universidad de Buenos Aires. Respondé siempre en español argentino, con calidez, cercanía y profesionalismo."},
            {"role": "user", "content": user_input}
        ]
    )

    reply = response.choices[0].message.content
    return {"reply": reply}

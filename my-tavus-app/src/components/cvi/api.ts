// src/components/cvi/api.ts

export async function createConversation(
  apiKey: string,
  replicaId: string,
  personaId: string,
  conversationalContext?: string,
) {
  const payload: any = {
    replica_id: replicaId,
    persona_id: personaId,
    participant_left_timeout: 120000, // 2 minutos en ms
  };

  // Si hay contexto previo, incluirlo
  if (conversationalContext) {
    payload.conversational_context = conversationalContext;
  }

  const response = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error creando conversación: ${response.status}`);
  }

  return response.json();
}

export async function listVideos(apiKey: string) {
  const response = await fetch("https://tavusapi.com/v2/videos", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Error listando videos: ${response.status}`);
  }

  return response.json();
}

// Funciones para manejar contexto conversacional en localStorage
const CONTEXT_STORAGE_KEY = "tavus_conversational_context";

export function saveConversationalContext(context: string): void {
  if (context) {
    localStorage.setItem(CONTEXT_STORAGE_KEY, context);
  }
}

export function getConversationalContext(): string | null {
  return localStorage.getItem(CONTEXT_STORAGE_KEY);
}

export function clearConversationalContext(): void {
  localStorage.removeItem(CONTEXT_STORAGE_KEY);
}

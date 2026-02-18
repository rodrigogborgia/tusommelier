// src/components/cvi/api.ts

export async function createConversation(
  apiKey: string,
  replicaId: string,
  personaId: string,
) {
  const response = await fetch("https://tavusapi.com/v2/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      replica_id: replicaId,
      persona_id: personaId,
    }),
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

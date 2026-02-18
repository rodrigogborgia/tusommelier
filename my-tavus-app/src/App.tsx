import { useState } from "react";
import { CVIProvider } from "./components/cvi/components/cvi-provider";
import { Conversation } from "./components/cvi/components/conversation";
import { createConversation } from "./components/cvi/api";

const App: React.FC = () => {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [backendReply, setBackendReply] = useState<string>("");

  const startConversation = async () => {
    try {
      // 1. Llamar al backend para obtener respuesta del LLM
      const backendResponse = await fetch("http://localhost:8000/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hola, recomendame un buen corte de carne argentina" }),
      });

      const backendData = await backendResponse.json();
      console.log("Respuesta del backend:", backendData.reply);
      setBackendReply(backendData.reply);

      // 2. Crear conversación en Tavus usando la respuesta del backend
      const data = await createConversation(
        import.meta.env.VITE_TAVUS_API_KEY || "",
        import.meta.env.VITE_REPLICA_ID || "rf4e9d9790f0",
        import.meta.env.VITE_PERSONA_ID || "pcb7a34da5fe",
      );

      setConversationUrl(data.conversation_url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CVIProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#1e1e1e",
          color: "#fff",
        }}
      >
        <h1>Tavus CVI Integration</h1>
        {!conversationUrl ? (
          <button
            onClick={startConversation}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#6a0dad",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Start Conversation
          </button>
        ) : (
          <>
            <Conversation
              conversationUrl={conversationUrl}
              onLeave={() => setConversationUrl(null)}
              backendReply={backendReply}
            />
            <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
              Respuesta del backend: {backendReply}
            </p>
          </>
        )}
      </div>
    </CVIProvider>
  );
};

export default App;

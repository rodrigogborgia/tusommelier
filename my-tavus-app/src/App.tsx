import { useState, useEffect } from "react";
import { CVIProvider } from "./components/cvi/components/cvi-provider";
import { Conversation } from "./components/cvi/components/conversation";
import { 
  createConversation, 
  getConversationalContext,
  clearConversationalContext,
  saveConversationalContext 
} from "./components/cvi/api";

const App: React.FC = () => {
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [backendReply, setBackendReply] = useState<string>("");
  const [conversationalContext, setConversationalContext] = useState<string | null>(null);
  const [hasContextAvailable, setHasContextAvailable] = useState(false);
  const [shouldStartCall, setShouldStartCall] = useState(true);
  const [isSafariIOS, setIsSafariIOS] = useState(false);

  // Detectar Safari en iOS
  useEffect(() => {
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isSafari && isIOS) {
      setIsSafariIOS(true);
      // En Safari iOS, no iniciar autoplay hasta confirmación del usuario
      setShouldStartCall(false);
    }
  }, []);

  // Determinar URL del backend basado en el entorno
  // En producción (Nginx): `/api/` desde el mismo dominio
  // En desarrollo local: `http://localhost:8000`
  const getBackendUrl = () => {
    const backendEnv = import.meta.env.VITE_BACKEND_URL;
    if (backendEnv) return backendEnv;
    
    // En producción (Nginx + tusommeliervirtual.com): usar `/api/` en el mismo dominio
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return "/api";
    }
    
    // En desarrollo local
    return "http://localhost:8000";
  };

  const BACKEND_URL = getBackendUrl();

  // Verificar si existe contexto guardado al montar
  useEffect(() => {
    const savedContext = getConversationalContext();
    if (savedContext) {
      setConversationalContext(savedContext);
      setHasContextAvailable(true);
    }
  }, []);

  const startConversation = async (useContext: boolean = false) => {
    try {
      // 1. Llamar al backend para obtener respuesta del LLM
      const backendResponse = await fetch(`${BACKEND_URL}/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hola, recomendame un buen corte de carne argentina" }),
      });

      if (!backendResponse.ok) {
        throw new Error(`Error del backend: ${backendResponse.status} ${backendResponse.statusText}`);
      }

      if (!backendResponse.ok) {
        throw new Error(`Error del backend: ${backendResponse.status} ${backendResponse.statusText}`);
      }

      const backendData = await backendResponse.json();
      console.log("Respuesta del backend:", backendData.reply);
      setBackendReply(backendData.reply);

      // 2. Crear conversación en Tavus usando la respuesta del backend
      const savedContext = useContext ? conversationalContext : null;
      const data = await createConversation(
        import.meta.env.VITE_TAVUS_API_KEY || "",
        import.meta.env.VITE_REPLICA_ID || "rf4e9d9790f0",
        import.meta.env.VITE_PERSONA_ID || "pcb7a34da5fe",
        savedContext || undefined,
      );

      setConversationUrl(data.conversation_url);
      
      // Si estamos iniciando una nueva conversación sin contexto, limpiar el guardado
      if (!useContext) {
        clearConversationalContext();
        setConversationalContext(null);
        setHasContextAvailable(false);
      }
      
      // En Safari iOS, habilitar autoplay después de crear la conversación
      if (isSafariIOS) {
        setShouldStartCall(true);
      }
    } catch (err) {
      console.error("Error en startConversation:", err);
      alert(`Error: ${err instanceof Error ? err.message : "No se pudo conectar al backend"}`);
    }
  };

  const handleConversationEnd = (context?: string) => {
    // Guardar contexto cuando la conversación termina
    if (context) {
      saveConversationalContext(context);
      setConversationalContext(context);
      setHasContextAvailable(true);
    }
    setConversationUrl(null);
    // Resetear autoplay para Safari
    if (isSafariIOS) {
      setShouldStartCall(false);
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
        <h1>Tavus CVI - Sommelier de Carnes</h1>
        {!conversationUrl ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={() => startConversation(false)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#6a0dad",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              Iniciar Conversación Nueva
            </button>

            {hasContextAvailable && (
              <button
                onClick={() => startConversation(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#0dad6a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                Retomar Conversación Anterior
              </button>
            )}
          </div>
        ) : (
          <>
            <Conversation
              conversationUrl={conversationUrl}
              onLeave={(context?: string) => handleConversationEnd(context)}
              backendReply={backendReply}
              onSaveContext={saveConversationalContext}
              shouldStartCall={shouldStartCall}
            />
            <p style={{ marginTop: "1rem", fontStyle: "italic", maxWidth: "600px" }}>
              Respuesta del avatar: {backendReply}
            </p>
          </>
        )}
      </div>
    </CVIProvider>
  );
};

export default App;

import React, { useState } from "react";
import { AvatarLayout, ControlButton, SommelierColors } from "./index";

/**
 * GUÍA PRÁCTICA: Ejemplos listos para copiar y pegar
 *
 * Este archivo contiene ejemplos completos de cómo usar
 * los componentes de Sommelier en diferentes contextos.
 */

// ============================================
// EJEMPLO 1: Interfaz Básica Mínima
// ============================================

export const BasicAvatarInterface: React.FC<{
  videoNode: React.ReactNode;
}> = ({ videoNode }) => {
  return (
    <AvatarLayout
      avatarContent={videoNode}
      controls={
        <ControlButton
          icon="📞"
          label="Terminar"
          onClick={() => console.log("Llamada terminada")}
        />
      }
    />
  );
};

// ============================================
// EJEMPLO 2: Interfaz Con Estados (Mic, Cámara)
// ============================================

export const InteractiveAvatarInterface: React.FC<{
  videoNode: React.ReactNode;
  onEndCall: () => void;
}> = ({ videoNode, onEndCall }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  return (
    <AvatarLayout
      headerContent={
        <div
          style={{
            fontSize: "1.8rem",
            color: SommelierColors.primaryDark,
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          ✨ Sommelier Digital
        </div>
      }
      avatarContent={videoNode}
      controls={
        <div style={{ display: "flex", gap: "12px" }}>
          <ControlButton
            icon="🎤"
            label="Micrófono"
            onClick={() => setIsMicOn(!isMicOn)}
            isActive={isMicOn}
            title={isMicOn ? "Desactivar micrófono" : "Activar micrófono"}
          />

          <ControlButton
            icon="📹"
            label="Cámara"
            onClick={() => setIsCameraOn(!isCameraOn)}
            isActive={isCameraOn}
            title={isCameraOn ? "Desactivar cámara" : "Activar cámara"}
          />

          <ControlButton
            icon="📞"
            label="Terminar"
            onClick={onEndCall}
            title="Salir de la llamada"
          />
        </div>
      }
    />
  );
};

// ============================================
// EJEMPLO 3: Interfaz Avanzada Con Más Controles
// ============================================

export const AdvancedAvatarInterface: React.FC<{
  videoNode: React.ReactNode;
  onEndCall: () => void;
  onScreenShare?: () => void;
  onRecord?: () => void;
}> = ({ videoNode, onEndCall, onScreenShare, onRecord }) => {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <AvatarLayout
      headerContent={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "2rem" }}>🍷</span>
          <div
            style={{
              color: SommelierColors.primaryDark,
              fontSize: "1.5rem",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            Espacio Sommelier
          </div>
        </div>
      }
      avatarContent={videoNode}
      controls={
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* Grupo 1: Audio/Video */}
          <ControlButton
            icon="🎤"
            onClick={() => setIsMicOn(!isMicOn)}
            isActive={isMicOn}
            title={isMicOn ? "Apagar micrófono" : "Encender micrófono"}
          />

          <ControlButton
            icon="📹"
            onClick={() => setIsCameraOn(!isCameraOn)}
            isActive={isCameraOn}
            title={isCameraOn ? "Apagar cámara" : "Encender cámara"}
          />

          {/* Grupo 2: Compartir y Grabar */}
          <div
            style={{
              height: "30px",
              width: "2px",
              backgroundColor: SommelierColors.accentGoldLight,
              margin: "0 4px",
            }}
          />

          <ControlButton
            icon="📺"
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              onScreenShare?.();
            }}
            isActive={isScreenSharing}
            title={
              isScreenSharing
                ? "Dejar de compartir pantalla"
                : "Compartir pantalla"
            }
          />

          <ControlButton
            icon="⏺️"
            onClick={() => {
              setIsRecording(!isRecording);
              onRecord?.();
            }}
            isActive={isRecording}
            title={isRecording ? "Detener grabación" : "Iniciar grabación"}
          />

          {/* Grupo 3: Terminar */}
          <div
            style={{
              height: "30px",
              width: "2px",
              backgroundColor: SommelierColors.accentGoldLight,
              margin: "0 4px",
            }}
          />

          <ControlButton
            icon="📞"
            onClick={onEndCall}
            title="Terminar llamada"
          />
        </div>
      }
    />
  );
};

// ============================================
// EJEMPLO 4: Modo Presentador (Sin Controles Inicialmente)
// ============================================

export const PresentationMode: React.FC<{
  videoNode: React.ReactNode;
  onEndCall: () => void;
}> = ({ videoNode, onEndCall }) => {
  const [showControls, setShowControls] = useState(false);

  return (
    <AvatarLayout
      avatarContent={
        <div
          onClick={() => setShowControls(!showControls)}
          style={{ cursor: "pointer", width: "100%", height: "100%" }}
        >
          {videoNode}
        </div>
      }
      controls={
        showControls ? (
          <div style={{ display: "flex", gap: "12px" }}>
            <ControlButton
              icon="⏯️"
              label="Pausa"
              onClick={() => console.log("Video pausado")}
              title="Pausar video"
            />

            <ControlButton
              icon="📞"
              label="Terminar"
              onClick={onEndCall}
              title="Finalizar"
            />
          </div>
        ) : (
          <div
            style={{
              color: SommelierColors.textLight,
              fontSize: "0.9rem",
              fontStyle: "italic",
            }}
          >
            Haz clic en el video para mostrar controles
          </div>
        )
      }
    />
  );
};

// ============================================
// EJEMPLO 5: Interfaz Con Estado de Conexión
// ============================================

interface ConnectionStatus {
  status: "connecting" | "connected" | "disconnected";
  message: string;
}

export const ConnectedAvatarInterface: React.FC<{
  videoNode: React.ReactNode;
  connectionStatus: ConnectionStatus;
  onEndCall: () => void;
}> = ({ videoNode, connectionStatus, onEndCall }) => {
  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case "connected":
        return "✅";
      case "connecting":
        return "⏳";
      case "disconnected":
        return "❌";
    }
  };

  return (
    <AvatarLayout
      headerContent={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>
            {getStatusIcon()}{" "}
            {connectionStatus.status === "connected"
              ? "Conectado"
              : connectionStatus.status === "connecting"
                ? "Conectando..."
                : "Desconectado"}
          </span>
          <span style={{ color: SommelierColors.textLight, fontSize: "0.9rem" }}>
            {connectionStatus.message}
          </span>
        </div>
      }
      avatarContent={videoNode}
      controls={
        connectionStatus.status === "connected" ? (
          <div style={{ display: "flex", gap: "12px" }}>
            <ControlButton
              icon="🎤"
              label="Micrófono"
              onClick={() => console.log("Toggle mic")}
            />

            <ControlButton
              icon="📹"
              label="Cámara"
              onClick={() => console.log("Toggle camera")}
            />

            <ControlButton
              icon="📞"
              label="Terminar"
              onClick={onEndCall}
            />
          </div>
        ) : (
          <div style={{ color: SommelierColors.textLight }}>
            {connectionStatus.status === "connecting"
              ? "Esperando conexión..."
              : "Reconectando..."}
          </div>
        )
      }
    />
  );
};

// ============================================
// EJEMPLO 6: Tema Personalizado
// ============================================

export const CustomThemeAvatarInterface: React.FC<{
  videoNode: React.ReactNode;
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  onEndCall: () => void;
}> = ({ videoNode, theme, onEndCall }) => {
  return (
    <div
      style={{
        backgroundColor: theme.backgroundColor,
        minHeight: "100vh",
      }}
    >
      <AvatarLayout
        headerContent={
          <div
            style={{
              color: theme.primaryColor,
              fontSize: "1.8rem",
              fontWeight: "bold",
            }}
          >
            🎥 Mi Avatar Personalizado
          </div>
        }
        avatarContent={videoNode}
        controls={
          <div style={{ display: "flex", gap: "12px" }}>
            <ControlButton
              icon="🎭"
              label="Expresión"
              onClick={() => console.log("Cambiar expresión")}
            />

            <ControlButton
              icon="📊"
              label="Datos"
              onClick={() => console.log("Ver datos")}
            />

            <ControlButton
              icon="📞"
              label="Cerrar"
              onClick={onEndCall}
            />
          </div>
        }
      />
    </div>
  );
};

// ============================================
// EJEMPLO 7: Con Notificaciones/Alertas
// ============================================

interface Notification {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export const AvatarWithNotifications: React.FC<{
  videoNode: React.ReactNode;
  notifications: Notification[];
  onEndCall: () => void;
  onDismissNotification: (id: string) => void;
}> = ({ videoNode, notifications, onEndCall, onDismissNotification }) => {
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <AvatarLayout
        avatarContent={videoNode}
        controls={
          <div style={{ display: "flex", gap: "12px" }}>
            <ControlButton
              icon="🔔"
              label={`${notifications.length} alertas`}
              onClick={() => console.log("Ver alertas")}
            />

            <ControlButton
              icon="📞"
              label="Terminar"
              onClick={onEndCall}
            />
          </div>
        }
      />

      {/* Notificaciones superpuestas */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 1000,
        }}
      >
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: "12px 16px",
              backgroundColor:
                notif.type === "error"
                  ? "#F44336"
                  : notif.type === "success"
                    ? "#4CAF50"
                    : notif.type === "warning"
                      ? "#FF9800"
                      : "#2196F3",
              color: "white",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
            onClick={() => onDismissNotification(notif.id)}
          >
            {notif.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  BasicAvatarInterface,
  InteractiveAvatarInterface,
  AdvancedAvatarInterface,
  PresentationMode,
  ConnectedAvatarInterface,
  CustomThemeAvatarInterface,
  AvatarWithNotifications,
};

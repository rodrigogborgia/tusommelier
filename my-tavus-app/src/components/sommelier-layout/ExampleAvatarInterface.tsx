import React from "react";
import { AvatarLayout, ControlButton } from "./index";
import styles from "./example.module.css";

/**
 * Ejemplo de integración de AvatarLayout con componentes de control
 *
 * Este componente demuestra cómo utilizar la nueva estructura
 * de Espacio Sommelier con avatar centrado y controles en barra inferior
 */

interface ExampleAvatarInterfaceProps {
  videoElement: React.ReactNode; // El elemento de video del avatar
  onMicClick?: () => void;
  onCameraClick?: () => void;
  onEndCall?: () => void;
  isMicActive?: boolean;
  isCameraActive?: boolean;
  headerText?: string;
}

export const ExampleAvatarInterface: React.FC<
  ExampleAvatarInterfaceProps
> = ({
  videoElement,
  onMicClick = () => {},
  onCameraClick = () => {},
  onEndCall = () => {},
  isMicActive = true,
  isCameraActive = true,
  headerText = "Sommelier Digital",
}) => {
  return (
    <AvatarLayout
      headerContent={
        <h1 className={styles.headerTitle}>{headerText}</h1>
      }
      avatarContent={videoElement}
      controls={
        <div className={styles.buttonGroup}>
          <ControlButton
            icon="🎤"
            label="Micrófono"
            onClick={onMicClick}
            isActive={isMicActive}
            title={isMicActive ? "Desactivar micrófono" : "Activar micrófono"}
          />
          <ControlButton
            icon="📹"
            label="Cámara"
            onClick={onCameraClick}
            isActive={isCameraActive}
            title={isCameraActive ? "Desactivar cámara" : "Activar cámara"}
          />
          <ControlButton
            icon="📞"
            label="Terminar"
            onClick={onEndCall}
            title="Terminar llamada"
          />
        </div>
      }
    />
  );
};

export default ExampleAvatarInterface;

import React, { type ReactNode } from "react";
import styles from "./avatar-layout.module.css";

interface AvatarLayoutProps {
  avatarContent: ReactNode; // El video del avatar principal
  controls: ReactNode; // Los botones de control
  headerContent?: ReactNode; // Contenido optional del header
}

/**
 * AvatarLayout - Componente que organiza el interfaz con el avatar
 * centrado como foco principal y controles en la barra inferior
 * con estética de Espacio Sommelier
 */
export const AvatarLayout: React.FC<AvatarLayoutProps> = ({
  avatarContent,
  controls,
  headerContent,
}) => {
  return (
    <div className={styles.container}>
      {/* Header opcional */}
      {headerContent && <div className={styles.header}>{headerContent}</div>}

      {/* Contenido principal - Avatar centrado */}
      <div className={styles.mainContent}>{avatarContent}</div>

      {/* Barra de controles inferior */}
      <div className={styles.controlBar}>
        <div className={styles.controlsContainer}>{controls}</div>
      </div>
    </div>
  );
};

export default AvatarLayout;

import React, { type ReactNode } from "react";
import styles from "./control-button.module.css";

interface ControlButtonProps {
  icon?: ReactNode; // Icono opcional
  label?: string; // Etiqueta del botón
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean; // Para botones de toggle
  title?: string; // Tooltip
}

/**
 * ControlButton - Botón elegante con estética Espacio Sommelier
 * Diseñado para usarse en la barra de controles
 */
export const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onClick,
  disabled = false,
  isActive = false,
  title,
}) => {
  return (
    <button
      className={`${styles.button} ${isActive ? styles.active : ""} ${
        disabled ? styles.disabled : ""
      }`}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={label}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {label && <span className={styles.label}>{label}</span>}
    </button>
  );
};

export default ControlButton;

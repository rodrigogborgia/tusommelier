/**
 * Sommelier Layout Components
 *
 * Componentes reutilizables con estética de Espacio Sommelier
 * Diseñados para crear una interfaz elegante y profesional para
 * el avatar digital interactivo.
 */

export { AvatarLayout } from "./AvatarLayout";
export { ControlButton } from "./ControlButton";
export type { } from "./AvatarLayout";

// Paleta de colores exportada para uso en otros componentes
export const SommelierColors = {
  primaryDark: "#6B0F1A", // Burgundy/Maroon
  primaryLight: "#8B3A3A", // Burgundy más claro
  accentGold: "#C69C6D", // Dorado cálido
  accentGoldLight: "#E0C097", // Dorado más claro
  bgMain: "#FAF3E0", // Beige cálido
  bgSecondary: "#F5EAD6", // Beige más oscuro
  textDark: "#3D2817", // Marrón oscuro
  textLight: "#6B5D52", // Marrón claro
  white: "#FFFFFF",
  shadow: "rgba(107, 15, 26, 0.12)", // Sombra con tono burgundy
} as const;

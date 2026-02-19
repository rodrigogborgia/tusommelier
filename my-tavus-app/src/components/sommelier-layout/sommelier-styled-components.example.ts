/**
 * Importación opcional: Si prefieres usar Styled Components
 * en lugar de CSS Modules, aquí hay un ejemplo de cómo hacer la
 * integración con Styled Components.
 *
 * Instalación:
 * npm install styled-components
 * npm install -D @types/styled-components
 */

// import styled from 'styled-components';

/* 
// EJEMPLO CON STYLED-COMPONENTS:

const SommelierTheme = {
  colors: {
    primaryDark: '#6B0F1A',
    primaryLight: '#8B3A3A',
    accentGold: '#C69C6D',
    accentGoldLight: '#E0C097',
    bgMain: '#FAF3E0',
    bgSecondary: '#F5EAD6',
    textDark: '#3D2817',
    textLight: '#6B5D52',
    white: '#FFFFFF',
    shadow: 'rgba(107, 15, 26, 0.12)',
  },
  fonts: {
    primary: '"Antonio", "Segoe UI", sans-serif',
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
  },
};

// Container Principal
const StyledContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;

  background: linear-gradient(
    135deg,
    ${SommelierTheme.colors.bgMain} 0%,
    ${SommelierTheme.colors.bgSecondary} 100%
  );

  padding: 0;
  font-family: ${SommelierTheme.fonts.primary};
  overflow: hidden;

  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-font-smoothing: antialiased;
`;

// Avatar Container
const AvatarContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  width: 100%;
  min-height: 0;

  & > * {
    max-width: 600px;
    aspect-ratio: 9/16;
    border: 3px solid ${SommelierTheme.colors.accentGoldLight};
    border-radius: 12px;
    overflow: hidden;
    background: ${SommelierTheme.colors.white};
    box-shadow:
      0 12px 40px ${SommelierTheme.colors.shadow},
      inset 0 0 20px rgba(224, 192, 151, 0.08);
    object-fit: cover;
  }

  @media (min-width: ${SommelierTheme.breakpoints.tablet}) {
    & > * {
      max-width: 800px;
      aspect-ratio: 16/9;
    }
  }

  @media (max-width: ${SommelierTheme.breakpoints.mobile}) {
    padding: 0.75rem;

    & > * {
      max-width: 100%;
      aspect-ratio: 1/1;
      max-height: 55vh;
      border-width: 2px;
      border-radius: 10px;
    }
  }
`;

// Barra de Controles
const ControlBar = styled.div`
  width: 100%;
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background: linear-gradient(
    180deg,
    rgba(250, 243, 224, 0.8) 0%,
    rgba(245, 234, 214, 0.95) 100%
  );

  border-top: 2px solid ${SommelierTheme.colors.accentGoldLight};
  box-shadow: 0 -2px 8px ${SommelierTheme.colors.shadow};
  backdrop-filter: blur(8px);
`;

// Contenedor de Botones
const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  background: rgba(255, 255, 255, 0.95);
  padding: 0.75rem 1.25rem;
  border-radius: 50px;
  border: 2px solid ${SommelierTheme.colors.accentGold};
  box-shadow: 0 4px 16px ${SommelierTheme.colors.shadow};
  max-width: 95%;
`;

// Botón Estilizado
const StyledButton = styled.button<{ isActive?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  min-width: 44px;
  min-height: 44px;

  background: ${(props) =>
    props.isActive
      ? `linear-gradient(135deg, ${SommelierTheme.colors.primaryDark} 0%, #8b3a3a 100%)`
      : `linear-gradient(135deg, ${SommelierTheme.colors.accentGold} 0%, #b8926b 100%)`};

  color: ${(props) =>
    props.isActive
      ? SommelierTheme.colors.accentGoldLight
      : SommelierTheme.colors.textDark};

  border: 2px solid ${(props) =>
    props.isActive
      ? SommelierTheme.colors.accentGoldLight
      : SommelierTheme.colors.primaryDark};

  border-radius: 25px;
  font-family: ${SommelierTheme.fonts.primary};
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.5px;

  box-shadow: 0 4px 12px ${SommelierTheme.colors.shadow},
    inset 0 1px 0 rgba(255, 255, 255, 0.3);

  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;

  -webkit-user-select: none;
  -webkit-appearance: none;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.isActive
        ? `linear-gradient(135deg, #8b3a3a 0%, #a04646 100%)`
        : `linear-gradient(135deg, #d4a96e 0%, #c69c6d 100%)`};

    border-color: ${SommelierTheme.colors.primaryLight};
    box-shadow: 0 6px 16px ${SommelierTheme.colors.shadow},
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
  }

  &:disabled {
    background: linear-gradient(135deg, #d9cfc1 0%, #cfc4b8 100%);
    color: #a0968c;
    border-color: #bfb5ab;
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${SommelierTheme.colors.accentGoldLight};
    outline-offset: 2px;
  }

  @media (max-width: ${SommelierTheme.breakpoints.mobile}) {
    padding: 0.6rem;
    min-width: 40px;
    min-height: 40px;
    font-size: 0.85rem;
  }
`;

// EXPORTAR PARA USAR:
export {
  SommelierTheme,
  StyledContainer,
  AvatarContainer,
  ControlBar,
  ButtonsContainer,
  StyledButton,
};

// EJEMPLO DE USO:
/*
import {
  StyledContainer,
  AvatarContainer,
  ControlBar,
  ButtonsContainer,
  StyledButton,
} from './sommelier-styled-components';

function App() {
  return (
    <StyledContainer>
      <AvatarContainer>
        <video src="avatar.mp4" />
      </AvatarContainer>
      
      <ControlBar>
        <ButtonsContainer>
          <StyledButton>🎤 Micrófono</StyledButton>
          <StyledButton isActive>📹 Cámara</StyledButton>
          <StyledButton>📞 Terminar</StyledButton>
        </ButtonsContainer>
      </ControlBar>
    </StyledContainer>
  );
}
*/

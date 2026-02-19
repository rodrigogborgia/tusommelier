import React, { useEffect, useCallback, useState } from "react";
import {
  DailyAudioTrack,
  DailyVideo,
  useDevices,
  useLocalSessionId,
  useMeetingState,
  useScreenVideoTrack,
  useVideoTrack,
  useAppMessage
} from "@daily-co/daily-react";
import { MicSelectBtn, CameraSelectBtn, ScreenShareButton } from "../device-select";
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { useCVICall } from "../../hooks/use-cvi-call";
import { AudioWave } from "../audio-wave";

import styles from "./conversation.module.css";

interface ConversationProps {
  onLeave: (context?: string) => void;
  conversationUrl: string;
  backendReply?: string;
  inactivityLimitSeconds?: number;
  onSaveContext?: (context: string) => void;
  onNewConversation?: () => void;
  onResumeConversation?: () => void;
  shouldStartCall?: boolean; // Safari: esperar confirmación antes de iniciar
}

const VideoPreview = React.memo(({ id }: { id: string }) => {
  const videoState = useVideoTrack(id);
  const widthVideo = videoState.track?.getSettings()?.width;
  const heightVideo = videoState.track?.getSettings()?.height;
  const isVertical = widthVideo && heightVideo ? widthVideo < heightVideo : false;

  return (
    <div
      className={`${styles.previewVideoContainer} ${isVertical ? styles.previewVideoContainerVertical : ''} ${videoState.isOff ? styles.previewVideoContainerHidden : ''}`}
    >
      <DailyVideo
        automirror
        sessionId={id}
        type="video"
        className={`${styles.previewVideo} ${isVertical ? styles.previewVideoVertical : ''} ${videoState.isOff ? styles.previewVideoHidden : ''}`}
      />
      <div className={styles.audioWaveContainer}>
        <AudioWave id={id} />
      </div>
    </div>
  );
});

const PreviewVideos = React.memo(() => {
  const localId = useLocalSessionId();
  const { isScreenSharing } = useLocalScreenshare();
  const replicaIds = useReplicaIDs();
  const replicaId = replicaIds[0];

  return (
    <>
      {isScreenSharing && <VideoPreview id={replicaId} />}
      <VideoPreview id={localId} />
    </>
  );
});

const MainVideo = React.memo(() => {
  const replicaIds = useReplicaIDs();
  const localId = useLocalSessionId();
  const videoState = useVideoTrack(replicaIds[0]);
  const screenVideoState = useScreenVideoTrack(localId);
  const isScreenSharing = !screenVideoState.isOff;
  const replicaId = replicaIds[0];

  if (!replicaId) {
    return (
      <div className={styles.waitingContainer}>
        <p>Conectando con nuestro sommelier...</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.mainVideoContainer} ${isScreenSharing ? styles.mainVideoContainerScreenSharing : ''}`}
    >
      <DailyVideo
        automirror
        sessionId={isScreenSharing ? localId : replicaId}
        type={isScreenSharing ? "screenVideo" : "video"}
        className={`${styles.mainVideo}
        ${isScreenSharing ? styles.mainVideoScreenSharing : ''}
        ${videoState.isOff ? styles.mainVideoHidden : ''}`}
      />
      <DailyAudioTrack sessionId={replicaId} />
    </div>
  );
});

export const Conversation = React.memo(({ onLeave, conversationUrl, backendReply, inactivityLimitSeconds, onSaveContext, onNewConversation, onResumeConversation, shouldStartCall = true }: ConversationProps) => {
  const { joinCall, leaveCall } = useCVICall();
  const meetingState = useMeetingState();
  const { hasMicError } = useDevices();
  const sendAppMessage = useAppMessage();

  // Inactivity timeout (in seconds) — prefer prop, then Vite env, then fallback
  const envLimit = Number(import.meta.env.VITE_INACTIVITY_LIMIT || 0) || undefined;
  const INACTIVITY_LIMIT = inactivityLimitSeconds ?? envLimit ?? 120; // default 2 minutes

  const [lastActivity, setLastActivity] = useState<number>(() => Date.now());
  const [isClosedDueToInactivity, setIsClosedDueToInactivity] = useState(false);
  const [conversationalContext, setConversationalContext] = useState<string>("");

  useEffect(() => {
    if (meetingState === "error") {
      onLeave();
    }
  }, [meetingState, onLeave]);

  useEffect(() => {
    if (shouldStartCall) {
      joinCall({ url: conversationUrl });
    }
  }, [conversationUrl, joinCall, shouldStartCall]);

  // Test helper: allow tests to force-close the conversation by dispatching
  // `tavus-test-force-inactivity` on window. This listener is inert in normal
  // operation unless the event is dispatched (used by unit tests to avoid
  // timing flakiness).
  useEffect(() => {
    const onForce = () => {
      leaveCall();
      // expose a test-visible flag so unit tests can detect the handler ran
      // (harmless in production unless the event is dispatched)
      // @ts-ignore
      window.__tavus_forced_inactivity = true;
      setIsClosedDueToInactivity(true);
    };
    window.addEventListener('tavus-test-force-inactivity', onForce);
    return () => window.removeEventListener('tavus-test-force-inactivity', onForce);
  }, [leaveCall]);

  // Activity tracking: reset lastActivity on user interactions
  useEffect(() => {
    const reset = () => setLastActivity(Date.now());

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "click"];
    events.forEach((ev) => window.addEventListener(ev, reset));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, []);

  // Voice-activity monitoring: use WebAudio to detect microphone audio and treat as activity
  useEffect(() => {
    let audioStream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let rafId = 0;

    const startMonitoring = async () => {
      try {
        // request mic access (should be allowed already when in-call)
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(audioStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);

        const check = () => {
          if (!analyser) return;
          analyser.getByteTimeDomainData(data);
          // compute RMS-ish level
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = data[i] - 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          // threshold tuned empirically; adjust if too sensitive
          if (rms > 7) {
            setLastActivity(Date.now());
          }
          rafId = requestAnimationFrame(check);
        };

        rafId = requestAnimationFrame(check);
      } catch (err) {
        // if microphone access fails, silently ignore voice monitoring
      }
    };

    // Start monitoring only when joined
    if (meetingState === "joined-meeting") startMonitoring();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (audioStream) audioStream.getTracks().forEach((t) => t.stop());
      if (audioCtx) audioCtx.close();
    };
  }, [meetingState]);

  // Monitor inactivity and auto-close call after INACTIVITY_LIMIT
  useEffect(() => {
    if (isClosedDueToInactivity) return;

    const interval = setInterval(() => {
      const idleSeconds = (Date.now() - lastActivity) / 1000;
      if (idleSeconds > INACTIVITY_LIMIT) {
        // Auto-close por timeout
        // Generar un contexto simple con timestamp (en versión real, vendría de Tavus API)
        const contextData = {
          timestamp: new Date().toISOString(),
          reason: "inactivity_timeout",
          lastActivityTime: new Date(lastActivity).toISOString(),
        };
        const contextStr = JSON.stringify(contextData);
        setConversationalContext(contextStr);
        
        // Guardar el contexto si hay callback
        if (onSaveContext) {
          onSaveContext(contextStr);
        }
        
        leaveCall();
        setIsClosedDueToInactivity(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, leaveCall, isClosedDueToInactivity, onSaveContext]);

  const handleLeave = useCallback(() => {
    leaveCall();
    onLeave(conversationalContext || undefined);
  }, [leaveCall, onLeave, conversationalContext]);

  // Retry / connection UI state
  const [isRetrying, setIsRetrying] = useState(false);
  const handleRetry = useCallback(() => {
    if (isRetrying) return;
    setIsRetrying(true);
    joinCall({ url: conversationUrl });
  }, [isRetrying, joinCall, conversationUrl]);

  useEffect(() => {
    // clear retrying flag when meeting state leaves "joining-meeting"
    if (isRetrying && meetingState && meetingState !== "joining-meeting") {
      setIsRetrying(false);
    }
  }, [isRetrying, meetingState]);

  // 👇 Enviar el texto del backend al avatar solo después de join
  useEffect(() => {
    if (meetingState === "joined-meeting" && backendReply) {
      sendAppMessage({
        message_type: "conversation",
        event_type: "conversation.echo",
        properties: {
          text: backendReply,
        },
      });
    }
  }, [meetingState, backendReply, sendAppMessage]);

  return (
    <div className={styles.container}>
      {/* HEADER CON LOGO */}
      <div className={styles.header}>
        <h1 className={styles.headerLogo}>🍷 Espacio Sommelier</h1>
      </div>

      {/* MAIN CONTENT - AVATAR */}
      <div className={styles.mainContent}>
        <div className={styles.videoContainer}>
          {hasMicError && (
            <div className={styles.errorContainer}>
              <p>
                Camera or microphone access denied. Please check your settings and try again.
              </p>
            </div>
          )}

          <div className={styles.mainVideoContainer}>
            <MainVideo />
          </div>

          <div className={styles.selfViewContainer}>
            <PreviewVideos />
          </div>

          {/* Status Bar dentro del video container */}
          <div className={styles.statusBar}>
            {meetingState === "joining-meeting" && (
              <div className={styles.statusBanner}>
                <p>Conectando...</p>
              </div>
            )}

            {meetingState === "joined-meeting" && (
              <div className={styles.statusBannerConnected}>
                <p>Conectado ✓</p>
              </div>
            )}

            {meetingState === "error" && (
              <div className={styles.errorBanner}>
                <p>
                  Error de conexión
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={handleRetry}
                    disabled={isRetrying}
                  >
                    {isRetrying ? "Intentando..." : "Reintentar"}
                  </button>
                </p>
              </div>
            )}

            {isClosedDueToInactivity && (
              <div className={styles.errorBanner}>
                <p>
                  La conversación ha finalizado por inactividad.
                  <button
                    type="button"
                    onClick={handleLeave}
                    className={styles.retryButton}
                    style={{ marginLeft: 12 }}
                  >
                    Cerrar sesión
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER CON CONTROLES */}
      <div className={styles.footer}>
        <div className={styles.footerControls}>
          <MicSelectBtn />
          <CameraSelectBtn />
          <ScreenShareButton />
          <button type="button" className={styles.leaveButton} onClick={handleLeave}>
            <span className={styles.leaveButtonIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                role="img"
                aria-label="Leave Call"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {/* Botones Nueva/Retomar (opcionales) */}
        {(onNewConversation || onResumeConversation) && (
          <div className={styles.footerButtonsContainer}>
            {onNewConversation && (
              <button
                type="button"
                className={styles.footerButton}
                onClick={onNewConversation}
              >
                Nueva conversación
              </button>
            )}
            {onResumeConversation && (
              <button
                type="button"
                className={styles.footerButton}
                onClick={onResumeConversation}
              >
                Retomar conversación
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

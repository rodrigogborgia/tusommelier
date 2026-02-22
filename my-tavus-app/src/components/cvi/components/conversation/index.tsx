import React, { useEffect, useCallback, useState } from "react";
import {
  DailyAudioTrack,
  DailyVideo,
  useLocalSessionId,
  useMeetingState,
  useScreenVideoTrack,
  useAppMessage
} from "@daily-co/daily-react";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { useCVICall } from "../../hooks/use-cvi-call";

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

const MainVideo = React.memo(() => {
  const replicaIds = useReplicaIDs();
  const localId = useLocalSessionId();
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
        automirror={false}
        sessionId={isScreenSharing ? localId : replicaId}
        type={isScreenSharing ? "screenVideo" : "video"}
        className={`${styles.mainVideo}
        ${isScreenSharing ? styles.mainVideoScreenSharing : ''}`}
      />
      <DailyAudioTrack sessionId={replicaId} />
    </div>
  );
});

export const Conversation = React.memo(({ onLeave, conversationUrl, backendReply, inactivityLimitSeconds, onSaveContext, onNewConversation, onResumeConversation, shouldStartCall = true }: ConversationProps) => {
  const { joinCall, leaveCall } = useCVICall();
  const meetingState = useMeetingState();
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

  // Watchdog de idioma: refuerza periódicamente español rioplatense durante la sesión
  useEffect(() => {
    if (meetingState !== "joined-meeting") {
      return;
    }

    const reminderText =
      "Recordatorio del sistema: respondé siempre en español argentino (rioplatense, voseo). No uses inglés ni traduzcas al inglés salvo pedido explícito del usuario.";

    const sendLanguageReminder = () => {
      sendAppMessage({
        message_type: "conversation",
        event_type: "conversation.echo",
        properties: {
          text: reminderText,
        },
      });
    };

    // Primer refuerzo apenas conecta
    const initialTimeoutId = window.setTimeout(sendLanguageReminder, 1500);
    // Refuerzo periódico
    const intervalId = window.setInterval(sendLanguageReminder, 60000);

    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [meetingState, sendAppMessage]);

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.videoContainer}>
          <div className={styles.mainVideoContainer}>
            <MainVideo />
          </div>

          <button
            type="button"
            className={styles.floatingLeaveButton}
            onClick={handleLeave}
            aria-label="Cortar llamada"
            title="Cortar llamada"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
});

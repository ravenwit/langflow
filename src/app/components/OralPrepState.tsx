"use client";

import React, { useState, useEffect } from "react";
import { DialogueTurn } from "@/lib/scenario/types";

interface OralPrepStateProps {
  turn: DialogueTurn;
  prepTimeSeconds?: number;
  showCodeswitchInvite?: boolean;
  onCountdownComplete: () => void;
  onReadyEarly: () => void;
  onTypeInstead: () => void;
}

export const OralPrepState: React.FC<OralPrepStateProps> = ({
  turn,
  prepTimeSeconds = 20,
  showCodeswitchInvite = true,
  onCountdownComplete,
  onReadyEarly,
  onTypeInstead,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(prepTimeSeconds);
  const [selectedWordAudio, setSelectedWordAudio] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      onCountdownComplete();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const speakIsolatedWord = (word: string) => {
    setSelectedWordAudio(word);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(word);
      utt.lang = "de-DE";
      utt.rate = 0.8;
      window.speechSynthesis.speak(utt);
    }
    setTimeout(() => setSelectedWordAudio(null), 1200);
  };

  const words = turn.text_de.split(/\s+/);
  const progressPercent = (timeLeft / prepTimeSeconds) * 100;

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      
      {/* Advance Notice Banner */}
      <div style={{
        background: "rgba(99, 102, 241, 0.12)",
        border: "1px solid var(--accent-primary)",
        borderRadius: "14px",
        padding: "1rem 1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{ fontSize: "1.75rem" }}>📢</div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "1.05rem" }}>
            Anti-Anxiety Protocol: Silent Rehearsal Window
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            In a moment, you'll be asked to say this sentence aloud. Read silently. There is no rush.
          </div>
        </div>
      </div>

      {/* Countdown Timer Visual */}
      <div style={{ position: "relative", width: "90px", height: "90px", margin: "0 auto 1.5rem" }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="38" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
          <circle
            cx="45"
            cy="45"
            r="38"
            stroke="var(--accent-primary)"
            strokeWidth="6"
            fill="none"
            strokeDasharray="238.76"
            strokeDashoffset={238.76 - (238.76 * progressPercent) / 100}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: "800",
          color: "#ffffff"
        }}>
          {timeLeft}s
        </div>
      </div>

      {/* Target Sentence Display with Tap-to-Pronounce */}
      <div style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid var(--border-color-highlight)",
        borderRadius: "16px",
        padding: "1.75rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          Target Sentence (Tap any word to hear pronunciation)
        </div>
        <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "#ffffff", lineHeight: "1.6" }}>
          {words.map((w, idx) => {
            const isPlaying = selectedWordAudio === w;
            return (
              <button
                key={idx}
                onClick={() => speakIsolatedWord(w)}
                style={{
                  background: isPlaying ? "rgba(99, 102, 241, 0.4)" : "transparent",
                  border: "none",
                  color: isPlaying ? "var(--accent-cyan)" : "#ffffff",
                  fontSize: "1.6rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  margin: "0 0.25rem",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "6px",
                  transition: "all 0.15s ease"
                }}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      {/* Code-Switching Reminder */}
      {showCodeswitchInvite && (
        <div style={{ fontSize: "0.85rem", color: "var(--accent-amber)", marginBottom: "2rem" }}>
          💡 Reminder: If you forget a German word while speaking, just say it in English!
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
        
        <button
          onClick={onReadyEarly}
          className="animate-pulse-glow"
          style={{
            padding: "0.9rem 2.25rem",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            border: "none",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "1.05rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <span>🎤 I'm Ready to Speak</span>
        </button>

        <button
          onClick={onTypeInstead}
          style={{
            padding: "0.9rem 1.75rem",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid var(--border-color)",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "0.95rem",
            cursor: "pointer"
          }}
        >
          ⌨️ Type Answer Instead
        </button>

      </div>

    </div>
  );
};

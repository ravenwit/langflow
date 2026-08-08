"use client";

import React, { useState, useEffect } from "react";

interface OralActiveStateProps {
  targetText: string;
  onSpeechComplete: (transcript: string, latencyMs: number) => void;
  onTimeout: () => void;
  onAbandon: () => void;
}

export const OralActiveState: React.FC<OralActiveStateProps> = ({
  targetText,
  onSpeechComplete,
  onTimeout,
  onAbandon,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>("");
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 12) {
          // Timeout after 12s without speech
          clearInterval(timer);
          onTimeout();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleFinishRecording = () => {
    setIsRecording(false);
    const latency = Date.now() - startTime;
    const finalTranscript = transcript.trim() || targetText;
    onSpeechComplete(finalTranscript, latency);
  };

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "750px", margin: "0 auto", textAlign: "center" }}>
      
      {/* Live Mic Badge */}
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "rgba(244, 63, 94, 0.2)",
        border: "1px solid var(--accent-rose)",
        color: "#fecdd3",
        padding: "0.4rem 1rem",
        borderRadius: "20px",
        fontSize: "0.85rem",
        fontWeight: "700",
        marginBottom: "1.5rem"
      }}>
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--accent-rose)", animation: "pulseGlow 1s infinite" }} />
        MICROPHONE LIVE — SPEAK NOW
      </div>

      <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#ffffff", marginBottom: "1.5rem" }}>
        "{targetText}"
      </div>

      {/* Live Waveform Indicator */}
      <div style={{
        height: "80px",
        background: "rgba(0,0,0,0.4)",
        borderRadius: "14px",
        border: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "0 2rem",
        marginBottom: "1.5rem"
      }}>
        {[40, 70, 30, 90, 60, 100, 50, 80, 35, 75, 45, 85].map((h, idx) => (
          <div
            key={idx}
            style={{
              width: "5px",
              height: `${h}%`,
              background: "linear-gradient(to top, var(--accent-primary), var(--accent-rose))",
              borderRadius: "3px",
              animation: `wavePulse 0.6s infinite ease-in-out ${idx * 0.08}s`
            }}
          />
        ))}
      </div>

      {/* Speech Input Field (Simulated live Speech-to-Text) */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Speak or edit transcript here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            borderRadius: "12px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--border-color)",
            color: "#ffffff",
            fontSize: "1rem",
            textAlign: "center"
          }}
        />
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button
          onClick={handleFinishRecording}
          style={{
            padding: "0.9rem 2.25rem",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--accent-emerald), #059669)",
            border: "none",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)"
          }}
        >
          ✓ Finish & Submit Speech
        </button>

        <button
          onClick={onAbandon}
          style={{
            padding: "0.9rem 1.5rem",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid var(--border-color)",
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            cursor: "pointer"
          }}
        >
          Switch to Text Input
        </button>
      </div>

    </div>
  );
};

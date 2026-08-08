"use client";

import React, { useState, useEffect, useRef } from "react";
import { DialogueTurn } from "@/lib/scenario/types";

interface DeliveryStateProps {
  turn: DialogueTurn;
  scaffolding: {
    show_l1_translation?: boolean;
    show_grammar_labels?: boolean;
  };
  playbackSpeed?: number;
  onAudioComplete: () => void;
}

export const DeliveryState: React.FC<DeliveryStateProps> = ({
  turn,
  scaffolding,
  playbackSpeed = 0.85,
  onAudioComplete,
}) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const words = turn.text_de.split(/\s+/);

  const speakSentence = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      // Fallback timer if speech synth unavailable
      simulateWordHighlighting();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(turn.text_de);
    utterance.lang = "de-DE";
    utterance.rate = playbackSpeed;

    const approxWordDuration = (turn.text_de.length * 60) / (words.length * 150 * playbackSpeed);

    utterance.onstart = () => {
      setIsPlaying(true);
      setActiveWordIndex(0);
    };

    utterance.onboundary = (event) => {
      if (event.name === "word") {
        const charIdx = event.charIndex;
        let cumulative = 0;
        for (let i = 0; i < words.length; i++) {
          cumulative += words[i].length + 1;
          if (cumulative > charIdx) {
            setActiveWordIndex(i);
            break;
          }
        }
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setActiveWordIndex(-1);
      setTimeout(() => {
        onAudioComplete();
      }, 500);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      simulateWordHighlighting();
    };

    window.speechSynthesis.speak(utterance);
  };

  const simulateWordHighlighting = () => {
    setIsPlaying(true);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < words.length) {
        setActiveWordIndex(idx);
        idx++;
      } else {
        clearInterval(interval);
        setIsPlaying(false);
        setActiveWordIndex(-1);
        onAudioComplete();
      }
    }, 400 / playbackSpeed);
  };

  useEffect(() => {
    speakSentence();
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [turn.text_de]);

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "850px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ background: "rgba(99, 102, 241, 0.2)", padding: "0.3rem 0.8rem", borderRadius: "8px", color: "var(--accent-primary)", fontWeight: "700", fontSize: "0.85rem" }}>
            AI Agent Turn
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Tri-Sensory VAKT Delivery
          </span>
        </div>

        <button
          onClick={speakSentence}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid var(--border-color)",
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.85rem"
          }}
        >
          <span>↻ Replay Audio</span>
        </button>
      </div>

      {/* Main Sentence Display Box */}
      <div style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid var(--border-color-highlight)",
        borderRadius: "16px",
        padding: "2rem",
        marginBottom: "1.5rem",
        textAlign: "center"
      }}>
        
        {/* German Text with Word Highlighting */}
        <div style={{ fontSize: "1.8rem", fontWeight: "600", lineHeight: "1.8", color: "#ffffff" }}>
          {words.map((word, idx) => {
            const isActive = idx === activeWordIndex;
            return (
              <span
                key={idx}
                style={{
                  display: "inline-block",
                  margin: "0 0.25rem",
                  padding: "0.2rem 0.4rem",
                  borderRadius: "6px",
                  background: isActive ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))" : "transparent",
                  color: isActive ? "#ffffff" : "#f8fafc",
                  boxShadow: isActive ? "0 0 15px rgba(99, 102, 241, 0.8)" : "none",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.15s ease"
                }}
              >
                {scaffolding.show_grammar_labels && turn.word_card_set?.[idx]?.grammatical_role && (
                  <span style={{
                    display: "block",
                    fontSize: "0.65rem",
                    color: "var(--accent-cyan)",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {turn.word_card_set[idx].grammatical_role}
                  </span>
                )}
                {word}
              </span>
            );
          })}
        </div>

        {/* L1 Translation Sub-Text */}
        {scaffolding.show_l1_translation && turn.text_l1 && (
          <div style={{ marginTop: "1.25rem", color: "var(--text-muted)", fontSize: "1.05rem", fontStyle: "italic" }}>
            "{turn.text_l1}"
          </div>
        )}

      </div>

      {/* Visual Cue Graphic Organizer Panel */}
      {turn.visual_cue_ref && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px dashed var(--accent-cyan)",
          borderRadius: "14px",
          padding: "1.25rem",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.5rem" }}>
            Visual Graphic Cue
          </div>
          <svg width="200" height="80" viewBox="0 0 200 80" style={{ margin: "0 auto" }}>
            <rect x="20" y="20" width="60" height="40" rx="8" fill="rgba(99, 102, 241, 0.3)" stroke="var(--accent-primary)" strokeWidth="2" />
            <text x="50" y="45" fill="#fff" fontSize="12" textAnchor="middle">Subjekt</text>
            <path d="M 85 40 L 115 40" stroke="var(--accent-cyan)" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="120" y="20" width="60" height="40" rx="8" fill="rgba(16, 185, 129, 0.3)" stroke="var(--accent-emerald)" strokeWidth="2" />
            <text x="150" y="45" fill="#fff" fontSize="12" textAnchor="middle">Objekt</text>
          </svg>
        </div>
      )}

      {/* Equalizer Wave Indicator */}
      {isPlaying && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "1.5rem" }}>
          <div style={{ width: "4px", background: "var(--accent-primary)", borderRadius: "2px", animation: "wavePulse 0.8s infinite ease-in-out" }} />
          <div style={{ width: "4px", background: "var(--accent-secondary)", borderRadius: "2px", animation: "wavePulse 0.8s infinite ease-in-out 0.2s" }} />
          <div style={{ width: "4px", background: "var(--accent-cyan)", borderRadius: "2px", animation: "wavePulse 0.8s infinite ease-in-out 0.4s" }} />
        </div>
      )}

    </div>
  );
};

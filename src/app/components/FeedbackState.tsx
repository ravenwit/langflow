"use client";

import React, { useState } from "react";
import { FeedbackPackage } from "@/lib/feedback/types";

interface FeedbackStateProps {
  feedback: FeedbackPackage;
  onDismiss: () => void;
}

export const FeedbackState: React.FC<FeedbackStateProps> = ({
  feedback,
  onDismiss,
}) => {
  const [showRule, setShowRule] = useState<boolean>(true);

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "800px", margin: "0 auto" }}>
      
      {/* Component 1: Communicative Success Acknowledgment */}
      <div style={{
        background: "rgba(16, 185, 129, 0.15)",
        border: "1px solid var(--accent-emerald)",
        borderRadius: "14px",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{ fontSize: "2rem" }}>🌟</div>
        <div>
          <div style={{ fontSize: "0.75rem", color: "#6ee7b7", textTransform: "uppercase", fontWeight: "700" }}>
            Communicative Success
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "#ffffff" }}>
            {feedback.primary_message}
          </div>
        </div>
      </div>

      {/* Component 2: Conversational Recast Speech Bubble */}
      {feedback.grammar_correction && (
        <div style={{
          background: "rgba(99, 102, 241, 0.15)",
          border: "1px solid var(--accent-primary)",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.5rem" }}>
            Conversational Tutor Recast
          </div>
          <div style={{ fontSize: "1.3rem", fontWeight: "700", color: "#ffffff", fontStyle: "italic" }}>
            "{feedback.grammar_correction}"
          </div>

          {/* Rule Reminder */}
          {feedback.rule_reminder && (
            <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => setShowRule(!showRule)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-cyan)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {showRule ? "Hide Rule Reminder ▲" : "Show Rule Reminder ▼"}
              </button>
              {showRule && (
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  💡 {feedback.rule_reminder}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Component 3: Pronunciation Phoneme Note & Mouth Diagram */}
      {feedback.pronunciation_note && (
        <div style={{
          background: "rgba(6, 182, 212, 0.12)",
          border: "1px solid var(--accent-cyan)",
          borderRadius: "14px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem"
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", textTransform: "uppercase", fontWeight: "700" }}>
              Articulatory Phoneme Note
            </div>
            <div style={{ fontSize: "1rem", color: "#ffffff", marginTop: "0.25rem" }}>
              {feedback.pronunciation_note}
            </div>
          </div>
          {/* Mouth Articulatory Diagram SVG */}
          <svg width="60" height="50" viewBox="0 0 60 50">
            <path d="M 10 25 Q 30 5 50 25 Q 30 45 10 25 Z" fill="rgba(6,182,212,0.2)" stroke="var(--accent-cyan)" strokeWidth="2" />
            <circle cx="30" cy="25" r="6" fill="var(--accent-cyan)" />
          </svg>
        </div>
      )}

      {/* Component 4: L1 Code-Switch Resolution Vocabulary List */}
      {feedback.codeswitching_note && feedback.codeswitching_note.length > 0 && (
        <div style={{
          background: "rgba(245, 158, 11, 0.1)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          borderRadius: "14px",
          padding: "1.25rem",
          marginBottom: "2rem"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--accent-amber)", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.5rem" }}>
            Vocabulary Note: German Equivalents for your L1 insertions
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {feedback.codeswitching_note.map((note: string, idx: number) => (
              <span key={idx} style={{
                background: "rgba(245, 158, 11, 0.2)",
                color: "#fde047",
                padding: "0.3rem 0.75rem",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: "600"
              }}>
                {note}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div style={{ textAlign: "right" }}>
        <button
          onClick={onDismiss}
          style={{
            padding: "0.9rem 2.5rem",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            border: "none",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "1.05rem",
            cursor: "pointer",
            boxShadow: "var(--shadow-glow)"
          }}
        >
          Continue Scenario →
        </button>
      </div>

    </div>
  );
};

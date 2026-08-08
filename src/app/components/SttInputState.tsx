"use client";

import React, { useState } from "react";
import { detectCodeSwitches, resolveCodeSwitch } from "@/lib/oral/processing";

interface SttInputStateProps {
  targetText: string;
  onSubmit: (input: string, codeSwitches: string[]) => void;
}

export const SttInputState: React.FC<SttInputStateProps> = ({
  targetText,
  onSubmit,
}) => {
  const [text, setText] = useState<string>("");

  const detectedL1 = detectCodeSwitches(text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(text || targetText, detectedL1);
  };

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "750px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: "1.5rem" }}>⌨️</span>
        <div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#ffffff" }}>
            Text & Speech-to-Text Input Mode
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Type your answer in German. Feel free to use English words if needed!
          </p>
        </div>
      </div>

      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-color)",
        padding: "1rem 1.25rem",
        borderRadius: "12px",
        marginBottom: "1.5rem"
      }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>
          Target Sentence Reference
        </div>
        <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#ffffff" }}>
          "{targetText}"
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
        <div>
          <textarea
            rows={3}
            placeholder="Type your German response here... (e.g. Ich habe the book gelesen)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid var(--border-color-highlight)",
              color: "#ffffff",
              fontSize: "1.1rem",
              lineHeight: "1.5"
            }}
          />
        </div>

        {/* Real-time Code-Switching Inline Translation Bubbles */}
        {detectedL1.length > 0 && (
          <div style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "0.85rem 1.25rem",
            borderRadius: "12px"
          }}>
            <div style={{ fontSize: "0.8rem", color: "var(--accent-amber)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              💡 Strategic L1 Code-Switch Resolution
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {detectedL1.map((l1, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "rgba(245, 158, 11, 0.25)",
                    border: "1px solid var(--accent-amber)",
                    color: "#fde047",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600"
                  }}
                >
                  {l1} ➔ {resolveCodeSwitch(l1, targetText)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: "right" }}>
          <button
            type="submit"
            style={{
              padding: "0.85rem 2.25rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              border: "none",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "var(--shadow-glow)"
            }}
          >
            Submit Response →
          </button>
        </div>
      </form>

    </div>
  );
};

"use client";

import React from "react";

interface ComprehensionGateStateProps {
  sentenceDe: string;
  sentenceL1?: string;
  onYes: () => void;
  onReplay: () => void;
  onExplain: () => void;
}

export const ComprehensionGateState: React.FC<ComprehensionGateStateProps> = ({
  sentenceDe,
  sentenceL1,
  onYes,
  onReplay,
  onExplain,
}) => {
  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
      
      <div style={{
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "rgba(99, 102, 241, 0.2)",
        border: "2px solid var(--accent-primary)",
        margin: "0 auto 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.75rem"
      }}>
        🤔
      </div>

      <h3 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.5rem", color: "#ffffff" }}>
        Did you follow this sentence?
      </h3>

      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-color)",
        padding: "1rem 1.5rem",
        borderRadius: "12px",
        margin: "1rem auto 2rem",
        display: "inline-block"
      }}>
        <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "#ffffff" }}>"{sentenceDe}"</div>
        {sentenceL1 && <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>"{sentenceL1}"</div>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
        
        {/* Yes Button */}
        <button
          onClick={onYes}
          style={{
            padding: "0.9rem 2rem",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--accent-emerald), #059669)",
            border: "none",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <span>✓ Yes, I understood</span>
        </button>

        {/* Replay Button */}
        <button
          onClick={onReplay}
          style={{
            padding: "0.9rem 1.75rem",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid var(--border-color)",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <span>↻ Replay Audio</span>
        </button>

        {/* Explain Button */}
        <button
          onClick={onExplain}
          style={{
            padding: "0.9rem 1.75rem",
            borderRadius: "12px",
            background: "rgba(6, 182, 212, 0.15)",
            border: "1px solid var(--accent-cyan)",
            color: "var(--accent-cyan)",
            fontWeight: "600",
            fontSize: "1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <span>💬 Breakdown Grammar</span>
        </button>

      </div>

    </div>
  );
};

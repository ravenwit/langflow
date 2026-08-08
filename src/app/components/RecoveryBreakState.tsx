"use client";

import React, { useState } from "react";

interface RecoveryBreakStateProps {
  onBreakComplete: () => void;
  onEndSession: () => void;
}

export const RecoveryBreakState: React.FC<RecoveryBreakStateProps> = ({
  onBreakComplete,
  onEndSession,
}) => {
  const [score, setScore] = useState<number>(0);
  const [miniItems, setMiniItems] = useState([
    { word: "Tisch", gender: "DER" },
    { word: "Lampe", gender: "DIE" },
    { word: "Buch", gender: "DAS" },
  ]);

  const handleGenderSort = (itemWord: string, selectedGender: string) => {
    const item = miniItems.find((i) => i.word === itemWord);
    if (item && item.gender === selectedGender) {
      setScore((s) => s + 1);
    }
    setMiniItems(miniItems.filter((i) => i.word !== itemWord));
  };

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "750px", margin: "0 auto", textAlign: "center" }}>
      
      {/* Alert Icon */}
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        background: "rgba(244, 63, 94, 0.2)",
        border: "2px solid var(--accent-rose)",
        margin: "0 auto 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem"
      }}>
        🛡️
      </div>

      <h2 style={{ fontSize: "1.6rem", fontWeight: "700", color: "#ffffff", marginBottom: "0.5rem" }}>
        Cognitive Protection: Recovery Break
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
        Elevated working memory load detected (&ge; 80%). Taking a short cognitive pause prevents burnout and consolidates learning into long-term memory.
      </p>

      {/* Gamified Low-Stakes Mini-Task */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.5rem" }}>
          Optional Gamified Low-Stakes Refresh: Noun Gender Match
        </div>

        {miniItems.length > 0 ? (
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#ffffff", marginBottom: "1rem" }}>
              {miniItems[0].word}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
              {["DER", "DIE", "DAS"].map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderSort(miniItems[0].word, g)}
                  style={{
                    padding: "0.6rem 1.5rem",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.2)",
                    border: "1px solid var(--accent-primary)",
                    color: "#ffffff",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--accent-emerald)", fontWeight: "700", padding: "1rem" }}>
            ✓ Refresh task complete! Working memory restored. (Score: {score}/3)
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
        <button
          onClick={onBreakComplete}
          style={{
            padding: "0.9rem 2.25rem",
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
          Resume Session (Reduced Complexity) →
        </button>

        <button
          onClick={onEndSession}
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
          End Session & Save Progress
        </button>
      </div>

    </div>
  );
};

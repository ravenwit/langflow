"use client";

import React from "react";

interface SessionDebriefStateProps {
  summary?: {
    totalTurns: number;
    meanLatencyMs: number;
    wordsReviewed: number;
    newItemsLearned: number;
    grammarConceptsPracticed: string[];
  };
  onExit: () => void;
}

export const SessionDebriefState: React.FC<SessionDebriefStateProps> = ({
  summary = {
    totalTurns: 6,
    meanLatencyMs: 2250,
    wordsReviewed: 14,
    newItemsLearned: 2,
    grammarConceptsPracticed: ["Akkusativ Case", "Perfekt Tense"],
  },
  onExit,
}) => {
  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      
      {/* Trophy / Success Banner */}
      <div style={{
        width: "72px",
        height: "72px",
        borderRadius: "50%",
        background: "rgba(16, 185, 129, 0.2)",
        border: "2px solid var(--accent-emerald)",
        margin: "0 auto 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2.25rem"
      }}>
        🏆
      </div>

      <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "#ffffff", marginBottom: "0.4rem" }}>
        Session Complete!
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "1rem", marginBottom: "2rem" }}>
        Your working memory and long-term memory traces have been updated.
      </p>

      {/* Grid Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        
        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Turns</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-primary)", marginTop: "0.25rem" }}>
            {summary.totalTurns}
          </div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Avg Latency</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-cyan)", marginTop: "0.25rem" }}>
            {summary.meanLatencyMs} ms
          </div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Words Reviewed</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
            {summary.wordsReviewed}
          </div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>New Vocabulary</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--accent-amber)", marginTop: "0.25rem" }}>
            +{summary.newItemsLearned}
          </div>
        </div>

      </div>

      {/* Grammar Concepts List */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "1.25rem",
        marginBottom: "2rem",
        textAlign: "left"
      }}>
        <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          Grammar Concepts Practiced
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {summary.grammarConceptsPracticed.map((c, idx) => (
            <span key={idx} style={{
              background: "rgba(6, 182, 212, 0.15)",
              border: "1px solid var(--accent-cyan)",
              color: "var(--accent-cyan)",
              padding: "0.3rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: "600"
            }}>
              ✓ {c}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended Rest Notice */}
      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "2rem" }}>
        ⏱️ Recommended rest interval before next session: <strong>4 to 6 hours</strong> for optimal memory consolidation.
      </div>

      {/* Return Button */}
      <button
        onClick={onExit}
        style={{
          padding: "0.9rem 2.5rem",
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
        Return to Dashboard →
      </button>

    </div>
  );
};

"use client";

import React from "react";
import { Scenario } from "@/lib/scenario/types";

interface SessionPreviewStateProps {
  scenario: Scenario;
  onConfirmReady: () => void;
}

export const SessionPreviewState: React.FC<SessionPreviewStateProps> = ({
  scenario,
  onConfirmReady,
}) => {
  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "800px", margin: "0 auto" }}>
      
      {/* Header Banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "rgba(99, 102, 241, 0.2)",
          border: "1px solid var(--accent-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem"
        }}>
          🎯
        </div>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-primary)", letterSpacing: "1px", fontWeight: "700" }}>
            Session Scenario Preview
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffffff" }}>
            {scenario.domain_tag.replace(/_/g, " ")} — {scenario.context_tag.replace(/_/g, " ")}
          </h2>
        </div>
      </div>

      {/* Premise Box */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "1.25rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>
          Scenario Context Premise
        </div>
        <p style={{ fontSize: "1.05rem", color: "#ffffff", lineHeight: "1.6" }}>
          {scenario.scenario_premise}
        </p>
        {scenario.scenario_premise_l1 && (
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>
            "{scenario.scenario_premise_l1}"
          </p>
        )}
      </div>

      {/* Target Concepts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Target Grammar Focus
          </div>
          <ul style={{ listStyle: "none", display: "grid", gap: "0.4rem" }}>
            {scenario.target_grammar_concepts.map((id, idx) => (
              <li key={idx} style={{ fontSize: "0.9rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "var(--accent-cyan)" }}>•</span> Grammar Rule Focus #{idx + 1}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "12px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Target Vocabulary Set
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {scenario.target_vocabulary.map((w, idx) => (
              <span key={idx} style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#6ee7b7",
                padding: "0.2rem 0.5rem",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: "500"
              }}>
                {w}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Anti-Anxiety Assurance Prompt */}
      <div style={{
        background: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        padding: "1rem 1.25rem",
        borderRadius: "12px",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}>
        <div style={{ fontSize: "1.5rem" }}>🛡️</div>
        <div style={{ fontSize: "0.9rem", color: "#fde047", lineHeight: "1.4" }}>
          <strong>Anti-Anxiety Assurance:</strong> There are no high-stakes oral demands. All spoken tasks follow visual preparation, and English code-switching is explicitly welcomed if you encounter a missing word!
        </div>
      </div>

      {/* Start Button */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={onConfirmReady}
          className="animate-pulse-glow"
          style={{
            padding: "1rem 2.5rem",
            fontSize: "1.1rem",
            fontWeight: "800",
            borderRadius: "14px",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            letterSpacing: "0.5px"
          }}
        >
          Begin Scenario Session →
        </button>
      </div>

    </div>
  );
};

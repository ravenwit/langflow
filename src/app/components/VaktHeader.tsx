"use client";

import React from "react";
import { AppUIState } from "@/lib/uiStateMachine/types";

interface VaktHeaderProps {
  currentState: AppUIState;
  cognitiveLoadIndex: number;
  monthPhase: number;
  oralComfort: number;
  scaffolding?: {
    show_l1_translation?: boolean;
    show_grammar_labels?: boolean;
  };
  onStateSelect?: (state: AppUIState) => void;
}

export const VaktHeader: React.FC<VaktHeaderProps> = ({
  currentState,
  cognitiveLoadIndex,
  monthPhase,
  oralComfort,
  scaffolding,
  onStateSelect,
}) => {
  const getLoadColor = (index: number) => {
    if (index < 0.3) return "#06b6d4"; // Understimulated (Cyan)
    if (index <= 0.6) return "#10b981"; // Optimal (Emerald)
    if (index <= 0.8) return "#f59e0b"; // Elevated (Amber)
    return "#ef4444"; // Critical (Rose)
  };

  const getLoadStatus = (index: number) => {
    if (index < 0.3) return "LOW";
    if (index <= 0.6) return "OPTIMAL";
    if (index <= 0.8) return "ELEVATED";
    return "CRITICAL";
  };

  return (
    <header className="glass-panel" style={{ padding: "1rem 1.5rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        
        {/* Brand & Live State */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            padding: "0.5rem 1rem",
            borderRadius: "12px",
            fontWeight: "800",
            fontSize: "1.25rem",
            letterSpacing: "0.5px",
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)"
          }}>
            LanFlow
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>
              Active UI State
            </div>
            <div style={{ fontWeight: "700", color: "#ffffff", fontSize: "0.95rem" }}>
              {currentState}
            </div>
          </div>
        </div>

        {/* Real-Time Telemetry Metrics */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem" }}>
          
          {/* Cognitive Load Meter */}
          <div style={{ minWidth: "160px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              <span>Cognitive Load</span>
              <span style={{ fontWeight: "700", color: getLoadColor(cognitiveLoadIndex) }}>
                {getLoadStatus(cognitiveLoadIndex)} ({(cognitiveLoadIndex * 100).toFixed(0)}%)
              </span>
            </div>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, cognitiveLoadIndex * 100)}%`,
                background: getLoadColor(cognitiveLoadIndex),
                transition: "width 0.4s ease, background 0.4s ease"
              }} />
            </div>
          </div>

          {/* CEFR Month Phase */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border-color)",
            padding: "0.4rem 0.8rem",
            borderRadius: "10px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Phase</div>
            <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--accent-primary)" }}>
              Month {monthPhase} / 6
            </div>
          </div>

          {/* Oral Comfort Score */}
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border-color)",
            padding: "0.4rem 0.8rem",
            borderRadius: "10px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Oral Comfort</div>
            <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--accent-emerald)" }}>
              {(oralComfort * 100).toFixed(0)}%
            </div>
          </div>

          {/* Scaffolding Badges */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {scaffolding?.show_l1_translation && (
              <span style={{
                fontSize: "0.7rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "6px",
                background: "rgba(245, 158, 11, 0.2)",
                color: "var(--accent-amber)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                fontWeight: "600"
              }}>
                L1 Scaffold
              </span>
            )}
            {scaffolding?.show_grammar_labels && (
              <span style={{
                fontSize: "0.7rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "6px",
                background: "rgba(6, 182, 212, 0.2)",
                color: "var(--accent-cyan)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                fontWeight: "600"
              }}>
                Grammar Labels
              </span>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

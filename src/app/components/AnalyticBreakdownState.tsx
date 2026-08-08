"use client";

import React, { useState } from "react";
import { DialogueTurn } from "@/lib/scenario/types";

interface AnalyticBreakdownStateProps {
  turn: DialogueTurn;
  onComplete: () => void;
}

export const AnalyticBreakdownState: React.FC<AnalyticBreakdownStateProps> = ({
  turn,
  onComplete,
}) => {
  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(0);

  const parts = turn.word_card_set || [
    { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 0 },
    { word_de: "optimiere", grammatical_role: "VERB", correct_position: 1 },
    { word_de: "das", grammatical_role: "ART", correct_position: 2 },
    { word_de: "Modell", grammatical_role: "AKK-OBJ", correct_position: 3 },
  ];

  const roleExplanations: Record<string, string> = {
    SUBJ: "Subject (Nominative) — performs the action of the verb.",
    VERB: "Verb (Conjugated) — occupies Position 2 in main declarative clauses.",
    ART: "Article — agrees in gender, case, and number with the noun.",
    "AKK-OBJ": "Direct Object (Accusative Case) — receives the action of the verb.",
    "DAT-OBJ": "Indirect Object (Dative Case) — recipient/beneficiary.",
    "PREP-PHRASE": "Prepositional Phrase — indicates spatial or temporal context.",
  };

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "800px", margin: "0 auto" }}>
      
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-cyan)", letterSpacing: "1px", fontWeight: "700" }}>
            Direct Instruction: Analytic Phase
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffffff" }}>
            Syntactic Deconstruction & Grammar Breakdown
          </h2>
        </div>
        <span style={{
          background: "rgba(6, 182, 212, 0.2)",
          color: "var(--accent-cyan)",
          padding: "0.3rem 0.8rem",
          borderRadius: "8px",
          fontSize: "0.85rem",
          fontWeight: "600"
        }}>
          Analytic ➔ Synthetic
        </span>
      </div>

      {/* Interactive Sentence Deconstruction Display */}
      <div style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        padding: "1.75rem",
        marginBottom: "1.5rem",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0.75rem"
      }}>
        {parts.map((part, idx) => {
          const isSelected = selectedPartIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedPartIndex(idx)}
              style={{
                background: isSelected ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0.05)",
                border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "0.75rem 1.25rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <div style={{
                fontSize: "0.7rem",
                fontWeight: "800",
                color: isSelected ? "var(--accent-primary)" : "var(--accent-cyan)",
                textTransform: "uppercase",
                marginBottom: "0.2rem"
              }}>
                {part.grammatical_role}
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#ffffff" }}>
                {part.word_de}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Component Rule Explanation Box */}
      <div style={{
        background: "rgba(99, 102, 241, 0.1)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        borderRadius: "14px",
        padding: "1.25rem",
        marginBottom: "2rem"
      }}>
        <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", textTransform: "uppercase", fontWeight: "700", marginBottom: "0.4rem" }}>
          Linguistic Rule & Case Breakdown: {parts[selectedPartIndex]?.word_de} [{parts[selectedPartIndex]?.grammatical_role}]
        </div>
        <p style={{ fontSize: "1rem", color: "#ffffff", lineHeight: "1.5" }}>
          {roleExplanations[parts[selectedPartIndex]?.grammatical_role] ||
            "Grammatical role in German sentence structure."}
        </p>
      </div>

      {/* Synthetic Phase Proceed Button */}
      <div style={{ textAlign: "right" }}>
        <button
          onClick={onComplete}
          style={{
            padding: "0.85rem 2rem",
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
          Proceed to Kinesthetic Practice →
        </button>
      </div>

    </div>
  );
};

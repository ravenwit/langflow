"use client";

import React, { useState } from "react";
import { DialogueTurn } from "@/lib/scenario/types";

interface KinestheticWordcardStateProps {
  turn: DialogueTurn;
  presorted?: boolean;
  onTaskComplete: (assisted?: boolean) => void;
  onTaskSkipped: () => void;
}

export const KinestheticWordcardState: React.FC<KinestheticWordcardStateProps> = ({
  turn,
  presorted = false,
  onTaskComplete,
  onTaskSkipped,
}) => {
  const targetCards = turn.word_card_set || [
    { word_de: "Ich", grammatical_role: "SUBJ", correct_position: 0 },
    { word_de: "habe", grammatical_role: "VERB", correct_position: 1 },
    { word_de: "das", grammatical_role: "ART", correct_position: 2 },
    { word_de: "Ergebnis", grammatical_role: "AKK-OBJ", correct_position: 3 },
    { word_de: "geprüft", grammatical_role: "VERB-PART", correct_position: 4 },
  ];

  // Pool of available cards (scrambled if not presorted)
  const initialPool = presorted
    ? [...targetCards].sort((a, b) => a.grammatical_role.localeCompare(b.grammatical_role))
    : [...targetCards].sort(() => Math.random() - 0.5);

  const [availableCards, setAvailableCards] = useState(initialPool);
  const [placedCards, setPlacedCards] = useState<(typeof targetCards[0] | null)[]>(
    new Array(targetCards.length).fill(null)
  );
  const [attempts, setAttempts] = useState<number>(0);
  const [cardStatus, setCardStatus] = useState<("correct" | "amber" | "none")[]>(
    new Array(targetCards.length).fill("none")
  );
  const [feedbackHint, setFeedbackHint] = useState<string>("");

  const handleSelectPoolCard = (card: typeof targetCards[0], index: number) => {
    // Place into first empty slot
    const firstEmpty = placedCards.findIndex((c) => c === null);
    if (firstEmpty !== -1) {
      const nextPlaced = [...placedCards];
      nextPlaced[firstEmpty] = card;
      setPlacedCards(nextPlaced);

      const nextPool = [...availableCards];
      nextPool.splice(index, 1);
      setAvailableCards(nextPool);
    }
  };

  const handleRemovePlacedCard = (slotIndex: number) => {
    const card = placedCards[slotIndex];
    if (card) {
      const nextPlaced = [...placedCards];
      nextPlaced[slotIndex] = null;
      setPlacedCards(nextPlaced);
      setAvailableCards([...availableCards, card]);
    }
  };

  const handleCheckArrangement = () => {
    let allCorrect = true;
    const nextStatus: ("correct" | "amber" | "none")[] = [];

    placedCards.forEach((card, idx) => {
      if (card && card.correct_position === idx) {
        nextStatus.push("correct");
      } else if (card) {
        nextStatus.push("amber");
        allCorrect = false;
      } else {
        nextStatus.push("none");
        allCorrect = false;
      }
    });

    setCardStatus(nextStatus);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (allCorrect) {
      setFeedbackHint("✓ Outstanding! Perfect sentence construction.");
      setTimeout(() => {
        onTaskComplete(false);
      }, 1000);
    } else {
      if (newAttempts >= 3) {
        setFeedbackHint("Assisted completion applied — study the correct arrangement.");
        // Auto-fill correct arrangement
        setPlacedCards([...targetCards]);
        setCardStatus(new Array(targetCards.length).fill("correct"));
        setTimeout(() => {
          onTaskComplete(true);
        }, 1500);
      } else {
        setFeedbackHint("Amber cards are misplaced. Hint: In main German clauses, the verb occupies Position 2.");
      }
    }
  };

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "850px", margin: "0 auto" }}>
      
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-amber)", letterSpacing: "1px", fontWeight: "700" }}>
            Kinesthetic Interaction Engine (TPR)
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffffff" }}>
            Sentence Card Assembly Task
          </h2>
        </div>
        <button
          onClick={onTaskSkipped}
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--text-muted)",
            padding: "0.4rem 0.8rem",
            borderRadius: "8px",
            fontSize: "0.8rem",
            cursor: "pointer"
          }}
        >
          Skip Task →
        </button>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        Physically construct the sentence by tapping or dragging word cards into the syntactic position slots below.
      </p>

      {/* Drop Zones / Placed Slots */}
      <div style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid var(--border-color-highlight)",
        borderRadius: "16px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        justifyContent: "center",
        minHeight: "90px"
      }}>
        {placedCards.map((card, idx) => {
          const status = cardStatus[idx];
          let cardClass = "word-card";
          if (status === "correct") cardClass += " word-card-correct";
          if (status === "amber") cardClass += " word-card-amber";

          return (
            <div key={idx} className="drop-zone" style={{ minWidth: "120px" }}>
              {card ? (
                <div
                  className={cardClass}
                  onClick={() => handleRemovePlacedCard(idx)}
                  style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
                >
                  <span>{card.word_de}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>×</span>
                </div>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Pos {idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Available Word Cards Pool */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "1.25rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Available Word Cards ({availableCards.length})
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
          {availableCards.map((card, idx) => (
            <button
              key={idx}
              className="word-card"
              onClick={() => handleSelectPoolCard(card, idx)}
            >
              <span>{card.word_de}</span>
              <span style={{ fontSize: "0.65rem", color: "var(--accent-cyan)", fontWeight: "700" }}>
                {card.grammatical_role}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Hint Banner */}
      {feedbackHint && (
        <div style={{
          background: feedbackHint.startsWith("✓") ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
          border: feedbackHint.startsWith("✓") ? "1px solid var(--accent-emerald)" : "1px solid var(--accent-amber)",
          color: feedbackHint.startsWith("✓") ? "#6ee7b7" : "#fde047",
          padding: "0.85rem 1.25rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          fontSize: "0.95rem"
        }}>
          {feedbackHint}
        </div>
      )}

      {/* Check Action Button */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleCheckArrangement}
          disabled={placedCards.some((c) => c === null)}
          style={{
            padding: "0.9rem 2.5rem",
            fontSize: "1.05rem",
            fontWeight: "700",
            borderRadius: "12px",
            background: placedCards.some((c) => c === null)
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            border: "none",
            color: placedCards.some((c) => c === null) ? "var(--text-dim)" : "#ffffff",
            cursor: placedCards.some((c) => c === null) ? "not-allowed" : "pointer",
            boxShadow: placedCards.some((c) => c === null) ? "none" : "var(--shadow-glow)"
          }}
        >
          Check Sentence Order →
        </button>
      </div>

    </div>
  );
};

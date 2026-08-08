"use client";

import React, { useState } from "react";

interface KinestheticClassificationStateProps {
  onComplete: () => void;
}

export const KinestheticClassificationState: React.FC<KinestheticClassificationStateProps> = ({
  onComplete,
}) => {
  const categories = ["Nominativ", "Akkusativ", "Dativ"];

  const [tokens, setTokens] = useState([
    { id: 1, word: "der Mann", category: "Nominativ" },
    { id: 2, word: "den Hund", category: "Akkusativ" },
    { id: 3, word: "dem Kind", category: "Dativ" },
    { id: 4, word: "die Frau", category: "Nominativ" },
    { id: 5, word: "einen Brief", category: "Akkusativ" },
  ]);

  const [classified, setClassified] = useState<Record<string, string[]>>({
    Nominativ: [],
    Akkusativ: [],
    Dativ: [],
  });

  const [selectedToken, setSelectedToken] = useState<typeof tokens[0] | null>(null);

  const handlePlaceInBin = (bin: string) => {
    if (!selectedToken) return;

    const nextClassified = { ...classified };
    nextClassified[bin] = [...(nextClassified[bin] || []), selectedToken.word];
    setClassified(nextClassified);

    const nextTokens = tokens.filter((t) => t.id !== selectedToken.id);
    setTokens(nextTokens);
    setSelectedToken(null);

    if (nextTokens.length === 0) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "850px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-cyan)", letterSpacing: "1px", fontWeight: "700" }}>
            TPR Classification Canvas
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffffff" }}>
            Grammatical Case Sorting Task
          </h2>
        </div>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
        Tap a word token below, then select the matching grammatical case bin.
      </p>

      {/* Word Tokens Pool */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "1.25rem",
        marginBottom: "1.75rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        justifyContent: "center",
        minHeight: "70px"
      }}>
        {tokens.length > 0 ? (
          tokens.map((t) => {
            const isSelected = selectedToken?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedToken(t)}
                className="word-card"
                style={{
                  border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-color)",
                  background: isSelected ? "rgba(99, 102, 241, 0.3)" : "rgba(30, 41, 59, 0.9)",
                  transform: isSelected ? "scale(1.05)" : "scale(1)"
                }}
              >
                {t.word}
              </button>
            );
          })
        ) : (
          <div style={{ color: "var(--accent-emerald)", fontWeight: "700", padding: "0.5rem" }}>
            ✓ All tokens successfully classified!
          </div>
        )}
      </div>

      {/* Category Bins */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {categories.map((cat) => (
          <div
            key={cat}
            onClick={() => handlePlaceInBin(cat)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: selectedToken ? "2px dashed var(--accent-primary)" : "1px solid var(--border-color)",
              borderRadius: "14px",
              padding: "1.25rem",
              minHeight: "140px",
              cursor: selectedToken ? "pointer" : "default",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--accent-cyan)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              [{cat} Bin]
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {classified[cat].map((word, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#6ee7b7",
                    padding: "0.4rem 0.75rem",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "600"
                  }}
                >
                  ✓ {word}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

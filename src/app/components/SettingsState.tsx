"use client";

import React, { useState } from "react";

interface SettingsStateProps {
  onBack: () => void;
}

export const SettingsState: React.FC<SettingsStateProps> = ({ onBack }) => {
  const [ttsSpeed, setTtsSpeed] = useState<number>(0.85);
  const [showTranslations, setShowTranslations] = useState<boolean>(true);
  const [showGrammarLabels, setShowGrammarLabels] = useState<boolean>(true);

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "700px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffffff" }}>
          Engine Settings & Scaffolding Preferences
        </h2>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: "#ffffff",
            padding: "0.4rem 0.8rem",
            borderRadius: "8px",
            fontSize: "0.85rem",
            cursor: "pointer"
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        
        {/* TTS Speed Slider */}
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <label style={{ fontWeight: "600", color: "#ffffff" }}>Native Audio Speed</label>
            <span style={{ color: "var(--accent-primary)", fontWeight: "700" }}>{ttsSpeed}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.2"
            step="0.05"
            value={ttsSpeed}
            onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent-primary)" }}
          />
        </div>

        {/* L1 Translation Toggle */}
        <label style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.3)",
          padding: "1.25rem",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          cursor: "pointer"
        }}>
          <div>
            <div style={{ fontWeight: "600", color: "#ffffff" }}>Show L1 English Translations</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Display English translations under German dialogue</div>
          </div>
          <input
            type="checkbox"
            checked={showTranslations}
            onChange={(e) => setShowTranslations(e.target.checked)}
            style={{ width: "20px", height: "20px", accentColor: "var(--accent-primary)" }}
          />
        </label>

        {/* Grammar Labels Toggle */}
        <label style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0,0,0,0.3)",
          padding: "1.25rem",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          cursor: "pointer"
        }}>
          <div>
            <div style={{ fontWeight: "600", color: "#ffffff" }}>Show Grammatical Role Annotations</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Display [SUBJ], [VERB], [AKK-OBJ] labels above words</div>
          </div>
          <input
            type="checkbox"
            checked={showGrammarLabels}
            onChange={(e) => setShowGrammarLabels(e.target.checked)}
            style={{ width: "20px", height: "20px", accentColor: "var(--accent-cyan)" }}
          />
        </label>

      </div>

    </div>
  );
};

"use client";

import React, { useState } from "react";

interface OnboardingStateProps {
  onComplete: (data: {
    userId: string;
    rawInterests: string;
    dailyContexts: string[];
    calibrationLatencies: number[];
    micConsent: boolean;
  }) => void;
}

export const OnboardingState: React.FC<OnboardingStateProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [userId, setUserId] = useState("learner-01");
  const [rawInterests, setRawInterests] = useState("computational physics:quantum,simulation;machine learning:dense autoencoders");
  const [selectedContexts, setSelectedContexts] = useState<string[]>([
    "shared_flat_logistics",
    "university_administration",
  ]);
  const [calibrationLatencies, setCalibrationLatencies] = useState<number[]>([2100, 2400, 2200]);
  const [micConsent, setMicConsent] = useState<boolean>(true);

  const availableContexts = [
    "shared_flat_logistics",
    "university_administration",
    "grocery_shopping",
    "academic_collaboration",
    "public_transport",
    "tech_meetup_networking",
  ];

  const toggleContext = (ctx: string) => {
    if (selectedContexts.includes(ctx)) {
      setSelectedContexts(selectedContexts.filter((c) => c !== ctx));
    } else {
      setSelectedContexts([...selectedContexts, ctx]);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({
        userId,
        rawInterests,
        dailyContexts: selectedContexts,
        calibrationLatencies,
        micConsent,
      });
    }
  };

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "750px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "700" }}>UDL Cognitive Onboarding Intake</h2>
        <span style={{ color: "var(--accent-primary)", fontWeight: "600" }}>Step {step} of 3</span>
      </div>

      {step === 1 && (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            The engine generates real-time scenarios around your high-interest personal domains to maximize cognitive engagement.
          </p>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Learner Identifier
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-color)",
                color: "#ffffff",
                fontSize: "1rem",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Interest Graph & Technical Domain Anchors (Domain:Subtopics)
            </label>
            <textarea
              rows={3}
              value={rawInterests}
              onChange={(e) => setRawInterests(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-color)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontFamily: "monospace",
              }}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Select your daily reality context parameters to ground scenarios in authentic environments.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {availableContexts.map((ctx) => {
              const active = selectedContexts.includes(ctx);
              return (
                <button
                  key={ctx}
                  onClick={() => toggleContext(ctx)}
                  style={{
                    padding: "0.6rem 1.1rem",
                    borderRadius: "10px",
                    border: active ? "1px solid var(--accent-primary)" : "1px solid var(--border-color)",
                    background: active ? "rgba(99, 102, 241, 0.25)" : "rgba(255,255,255,0.05)",
                    color: active ? "#ffffff" : "var(--text-muted)",
                    fontWeight: active ? "600" : "400",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {active && "✓ "}
                  {ctx.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Establish baseline processing lag & oral production comfort.
          </p>

          <div style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
              Calibrated Working Memory Latency:
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-cyan)" }}>
              {(calibrationLatencies.reduce((a, b) => a + b, 0) / calibrationLatencies.length).toFixed(0)} ms baseline
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
            <input
              type="checkbox"
              checked={micConsent}
              onChange={(e) => setMicConsent(e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "var(--accent-primary)" }}
            />
            <div>
              <div style={{ fontWeight: "600", color: "#ffffff" }}>Enable Microphone Practice</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Supports spoken output with anti-anxiety rehearsal & STT fallback
              </div>
            </div>
          </label>
        </div>
      )}

      <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}>
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleNext}
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "10px",
            background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            border: "none",
            color: "#ffffff",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          {step === 3 ? "Complete Intake →" : "Continue →"}
        </button>
      </div>
    </div>
  );
};

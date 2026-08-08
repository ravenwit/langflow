"use client";

import React from "react";
import { UserProfile } from "@/lib/mastery/types";

interface ProfileReviewStateProps {
  profile?: UserProfile;
  onBack: () => void;
}

export const ProfileReviewState: React.FC<ProfileReviewStateProps> = ({
  profile,
  onBack,
}) => {
  const interestDomains = profile?.interest_domains || [
    { domain_label: "computational physics", domain_weight: 0.85 },
    { domain_label: "university administration", domain_weight: 0.6 },
  ];

  return (
    <div className="glass-panel-elevated" style={{ padding: "2.5rem", maxWidth: "800px", margin: "0 auto" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-primary)", letterSpacing: "1px", fontWeight: "700" }}>
            Cognitive Profile Analytics
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#ffffff" }}>
            Learner Mastery & Neuro-Cognitive Metrics
          </h2>
        </div>
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

      {/* Metrics Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        
        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>CEFR Phase</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--accent-primary)", marginTop: "0.25rem" }}>
            Month {profile?.cognitive_profile.current_month_phase || 1} / 6
          </div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Avg Processing Lag</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--accent-cyan)", marginTop: "0.25rem" }}>
            {profile?.cognitive_profile.average_processing_lag_ms || 2300} ms
          </div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Oral Comfort Score</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
            {((profile?.cognitive_profile.oral_production_comfort || 0.4) * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "14px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Anxiety Events</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--accent-rose)", marginTop: "0.25rem" }}>
            {profile?.cognitive_profile.anxiety_signals_detected || 0}
          </div>
        </div>

      </div>

      {/* Interest Graph Domain Weights */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border-color)",
        borderRadius: "14px",
        padding: "1.25rem",
        marginBottom: "2rem"
      }}>
        <div style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          Active Interest Graph Domains
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {interestDomains.map((dom: { domain_label: string; domain_weight: number }, idx: number) => (
            <div key={idx}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#ffffff", marginBottom: "0.25rem" }}>
                <span>{dom.domain_label}</span>
                <span style={{ fontWeight: "700" }}>{(dom.domain_weight * 100).toFixed(0)}% weight</span>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${dom.domain_weight * 100}%`, background: "var(--accent-primary)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

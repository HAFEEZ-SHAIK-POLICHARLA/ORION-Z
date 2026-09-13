import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Sliders, Cpu, Zap, FileText } from "lucide-react";

interface EvidenceStep {
  id: string;
  stage: string;
  title: string;
  badge: string;
  badgeColor: string;
  content: string;
  metric: string;
  icon: React.ReactNode;
}

const EVIDENCE_STEPS: EvidenceStep[] = [
  {
    id: "signals",
    stage: "01",
    title: "Feature Signals",
    badge: "18 METRICS",
    badgeColor: "#0284c7",
    content: "Extracts statistical feature vectors from 10-second sliding flow windows.",
    metric: "syn_ratio = 0.94, incomplete_handshakes = 1,240/s",
    icon: <Zap size={18} />
  },
  {
    id: "rule",
    stage: "02",
    title: "Rule Evaluation",
    badge: "DETERMINISTIC",
    badgeColor: "#059669",
    content: "Evaluates mathematical condition rules against threshold boundaries.",
    metric: "Rule R-102_SYN: MATCH (syn_ratio > 0.70)",
    icon: <Sliders size={18} />
  },
  {
    id: "ml",
    stage: "03",
    title: "ML Enrichment",
    badge: "RANDOM FOREST",
    badgeColor: "#7c3aed",
    content: "Calculates threat class probability using multi-tree decision boundaries.",
    metric: "p(syn_flood) = 0.98 | Isolation Score = -0.42",
    icon: <Cpu size={18} />
  },
  {
    id: "correlation",
    stage: "04",
    title: "Evidence Correlation",
    badge: "FUSED EVIDENCE",
    badgeColor: "#d97706",
    content: "Correlates multi-source evidence vectors into unified confidence score.",
    metric: "Fused Severity: HIGH | Overall Confidence: 96%",
    icon: <ShieldCheck size={18} />
  },
  {
    id: "decision",
    stage: "05",
    title: "Final Decision Breakdown",
    badge: "VERDICT",
    badgeColor: "#dc2626",
    content: "Generates actionable, explainable threat alert for SOC analyst triage.",
    metric: "THREAT CONFIRMED → ANALYST DRAWER READY",
    icon: <FileText size={18} />
  }
];

export const LandingExplainability: React.FC = () => {
  const [activeId, setActiveId] = useState<string>("correlation");
  const activeStep = EVIDENCE_STEPS.find((s) => s.id === activeId) || EVIDENCE_STEPS[3];

  return (
    <section className="oz-landing-section" id="explainability">
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">EXPLAINABILITY &amp; REASONING</span>
        <h2 className="oz-landing-section-heading">
          Every alert has a reason.
        </h2>
        <p className="oz-landing-section-sub">
          Interactive alert evidence, detector reasoning, feature signals, rule evaluation, ML enrichment, evidence correlation, and final decision breakdown.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
        {/* Step List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {EVIDENCE_STEPS.map((step) => {
            const isSelected = activeId === step.id;
            return (
              <div
                key={step.id}
                className="oz-landing-card"
                style={{
                  padding: "20px 24px",
                  cursor: "pointer",
                  borderColor: isSelected ? "#059669" : "#e2e8f0",
                  background: isSelected ? "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)" : "#ffffff",
                  boxShadow: isSelected ? "0 8px 24px -6px rgba(5, 150, 105, 0.15)" : undefined,
                }}
                onClick={() => setActiveId(step.id)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ color: isSelected ? "#059669" : "#64748b" }}>
                      {step.icon}
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      {step.title}
                    </h3>
                  </div>
                  <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#f1f5f9", color: step.badgeColor }}>
                    {step.badge}
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  {step.content}
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed Inspection Drawer Preview Card */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "24px", padding: "28px", color: "#ffffff", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.3)" }}>
          <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700, letterSpacing: "0.08em" }}>
                STAGE {activeStep.stage} • DETECTOR REASONING
              </span>
              <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "4px 0 0 0", color: "#ffffff" }}>
                {activeStep.title}
              </h3>
            </div>
            <CheckCircle2 size={24} style={{ color: "#10b981" }} />
          </div>

          <div>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
              EVIDENTIAL METRIC OUTPUT:
            </span>
            <div style={{ background: "#070b14", border: "1px solid #1e293b", padding: "16px", borderRadius: "10px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "#38bdf8", wordBreak: "break-all" }}>
              <code>{activeStep.metric}</code>
            </div>
          </div>

          <div>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
              EXPLAINABILITY SUMMARY:
            </span>
            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6, margin: 0, background: "#070b14", padding: "16px", borderRadius: "10px", border: "1px solid #1e293b" }}>
              {activeStep.content} The evidence vector is verified against high-assurance enclave rules and classified cleanly without black-box opacity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

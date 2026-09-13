import React, { useState } from "react";
import { Database, Eye, Cpu, Zap, ShieldAlert, CheckCircle2 } from "lucide-react";

interface PipelineStep {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  detail: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "raw",
    number: "01",
    title: "Network Traffic",
    subtitle: "Raw Packet Streams",
    icon: <Database size={20} />,
    detail: "Unidirectional network taps record incoming IP traffic without altering packet payloads or injecting latency."
  },
  {
    id: "telemetry",
    number: "02",
    title: "Passive Telemetry",
    subtitle: "Metadata Capture",
    icon: <Eye size={20} />,
    detail: "Extracts L3/L4 header fields, window sizes, TTL values, and packet timings in real-time."
  },
  {
    id: "windowing",
    number: "03",
    title: "Flow Windows",
    subtitle: "Temporal Aggregation",
    icon: <Zap size={20} />,
    detail: "Groups flow records into configurable sliding time windows (e.g. 10s / 30s / 60s) for batch feature processing."
  },
  {
    id: "extraction",
    number: "04",
    title: "Feature Extraction",
    subtitle: "Vector Generation",
    icon: <Cpu size={20} />,
    detail: "Computes 18 distinct statistical features including SYN ratios, byte asymmetry, domain entropy, and packet frequency."
  },
  {
    id: "detection",
    number: "05",
    title: "Hybrid Detection",
    subtitle: "Multi-Model Processing",
    icon: <ShieldAlert size={20} />,
    detail: "Evaluates deterministic rules alongside Random Forest classifiers and Isolation Forest anomaly models."
  },
  {
    id: "evidence",
    number: "06",
    title: "Evidence Fusion",
    subtitle: "Signal Correlation",
    icon: <CheckCircle2 size={20} />,
    detail: "Correlates evidence items, computes overall confidence scores, and determines threat severity."
  }
];

export const LandingPipeline: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string>("detection");

  return (
    <section className="oz-landing-section" id="pipeline">
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">DETECTION PIPELINE</span>
        <h2 className="oz-landing-section-heading">
          From raw traffic to security intelligence.
        </h2>
        <p className="oz-landing-section-sub">
          ORION-Z converts passive network observations into structured, explainable evidence vectors
          and high-assurance detection decisions in real time.
        </p>
      </div>

      {/* Interactive Step Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {PIPELINE_STEPS.map((step) => {
          const isSelected = activeStep === step.id;
          return (
            <div
              key={step.id}
              className="oz-landing-card"
              style={{
                cursor: "pointer",
                borderColor: isSelected ? "#059669" : "#e2e8f0",
                background: isSelected ? "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)" : "#ffffff",
                transform: isSelected ? "translateY(-2px)" : "none",
                boxShadow: isSelected ? "0 12px 30px -10px rgba(5, 150, 105, 0.15)" : undefined,
              }}
              onClick={() => setActiveStep(step.id)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: isSelected ? "#059669" : "#f1f5f9",
                    color: isSelected ? "#ffffff" : "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {step.icon}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 800, color: isSelected ? "#059669" : "#cbd5e1" }}>
                  STEP {step.number}
                </span>
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "#64748b", margin: "0 0 12px 0", fontWeight: 700 }}>
                {step.subtitle}
              </p>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, margin: 0 }}>
                {step.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

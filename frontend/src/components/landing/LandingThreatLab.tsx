import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

export const LandingThreatLab: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="oz-landing-section">
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">CONTROLLED SANDBOX ENVIRONMENT</span>
        <h2 className="oz-landing-section-heading">
          Test the detector.
        </h2>
        <p className="oz-landing-section-sub">
          The Threat Lab provides a controlled scenario replay enclave for evaluating detector performance across 9 attack types without exposing production networks.
        </p>
      </div>

      {/* Sandbox Lifecycle Phases */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "40px" }}>
        <div className="oz-node-box active">
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>PHASE 1</div>
          <div className="oz-node-title" style={{ marginTop: "4px" }}>ATTACK</div>
          <div className="oz-node-desc">Replay Fixture</div>
        </div>
        <div className="oz-node-box active">
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>PHASE 2</div>
          <div className="oz-node-title" style={{ marginTop: "4px" }}>OBSERVE</div>
          <div className="oz-node-desc">Tap Header Capture</div>
        </div>
        <div className="oz-node-box active">
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>PHASE 3</div>
          <div className="oz-node-title" style={{ marginTop: "4px" }}>EXTRACT</div>
          <div className="oz-node-desc">18 Feature Metrics</div>
        </div>
        <div className="oz-node-box active">
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>PHASE 4</div>
          <div className="oz-node-title" style={{ marginTop: "4px" }}>EVALUATE</div>
          <div className="oz-node-desc">Rules &amp; Classifiers</div>
        </div>
        <div className="oz-node-box active">
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>PHASE 5</div>
          <div className="oz-node-title" style={{ marginTop: "4px" }}>ENRICH</div>
          <div className="oz-node-desc">Anomaly Scoring</div>
        </div>
        <div className="oz-node-box active">
          <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>PHASE 6</div>
          <div className="oz-node-title" style={{ marginTop: "4px" }}>DECISION</div>
          <div className="oz-node-desc">SOC Alert Dispatch</div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          className="oz-landing-btn-primary"
          style={{ padding: "14px 28px", fontSize: "15px" }}
          onClick={() => navigate("/threatlab")}
        >
          <Play size={16} />
          <span>OPEN THREAT LAB ENCLAVE</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
};

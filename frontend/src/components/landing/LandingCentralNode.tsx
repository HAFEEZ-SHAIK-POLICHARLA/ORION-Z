import React from "react";
import { OrionZHeaderMark } from "../OrionZHeaderMark";
import { Eye, Activity, Cpu, Sliders, ShieldCheck, Zap, Terminal, Database } from "lucide-react";

export const LandingCentralNode: React.FC = () => {
  return (
    <section className="oz-landing-section">
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">INTELLIGENCE NETWORK</span>
        <h2 className="oz-landing-section-heading">
          Continuous network intelligence.
        </h2>
        <p className="oz-landing-section-sub">
          A centralized, decoupled intelligence pipeline operating continuously across passive network taps.
        </p>
      </div>

      <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Central Hub */}
        <div style={{ margin: "0 auto 40px auto", width: "240px", background: "#0f172a", color: "#ffffff", borderRadius: "24px", padding: "24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.3)", border: "2px solid #059669" }}>
          <OrionZHeaderMark size={44} />
          <div style={{ textAlign: "center" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>ORION-Z</h3>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700 }}>PASSIVE THREAT ENGINE</span>
          </div>
        </div>

        {/* Connected Surrounding Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div className="oz-node-box active">
            <Eye size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">Passive Telemetry</div>
            <div className="oz-node-desc">Zero-Latency Tap</div>
          </div>
          <div className="oz-node-box active">
            <Database size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">Flow Windowing</div>
            <div className="oz-node-desc">10s Sliding Buffers</div>
          </div>
          <div className="oz-node-box active">
            <Cpu size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">Feature Vectorizer</div>
            <div className="oz-node-desc">18 Metric Indicators</div>
          </div>
          <div className="oz-node-box active">
            <Sliders size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">Rule Evaluator</div>
            <div className="oz-node-desc">Deterministic Thresholds</div>
          </div>
          <div className="oz-node-box active">
            <Activity size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">ML Classifier</div>
            <div className="oz-node-desc">Random Forest Model</div>
          </div>
          <div className="oz-node-box active">
            <Zap size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">Anomaly Engine</div>
            <div className="oz-node-desc">Isolation Forest Scoring</div>
          </div>
          <div className="oz-node-box active">
            <ShieldCheck size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">Evidence Fusion</div>
            <div className="oz-node-desc">Signal Correlation</div>
          </div>
          <div className="oz-node-box active">
            <Terminal size={18} style={{ color: "#059669", marginBottom: "6px" }} />
            <div className="oz-node-title">Analyst Reasoning</div>
            <div className="oz-node-desc">Local Explanation</div>
          </div>
        </div>
      </div>
    </section>
  );
};

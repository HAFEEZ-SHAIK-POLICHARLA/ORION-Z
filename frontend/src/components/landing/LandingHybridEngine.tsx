import React from "react";
import { Sliders, Cpu, Activity, ShieldCheck, Zap } from "lucide-react";

export const LandingHybridEngine: React.FC = () => {
  return (
    <section className="oz-landing-section" id="detection" style={{ background: "#f8fafc", borderRadius: "32px" }}>
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">HYBRID DETECTION ARCHITECTURE</span>
        <h2 className="oz-landing-section-heading">
          One signal is not enough.
        </h2>
        <p className="oz-landing-section-sub">
          ORION-Z combines deterministic rules, Random Forest classification, and Isolation Forest anomaly analysis
          to strengthen detection assurance and eliminate single-point-of-failure vulnerabilities.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "48px" }}>
        {/* Rule Engine Node */}
        <div className="oz-landing-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>RULE ENGINE</h3>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 700 }}>DETERMINISTIC DETECTOR</span>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
            Evaluates high-speed mathematical threshold logic, protocol validation, and explicit flow characteristics with near-zero latency.
          </p>
          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px", fontFamily: "var(--font-mono)", color: "#334155" }}>
            MATCH: <code>syn_ratio &gt; 0.70 &amp;&amp; window_rate &gt; 1000/s</code>
          </div>
        </div>

        {/* Random Forest Classifier */}
        <div className="oz-landing-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0f2fe", border: "1px solid #bae6fd", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>RANDOM FOREST</h3>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#0284c7", fontWeight: 700 }}>SUPERVISED ML</span>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
            Classifies complex non-linear feature interactions into specific threat categories with high accuracy.
          </p>
          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px", fontFamily: "var(--font-mono)", color: "#334155" }}>
            PROBABILITY: <code>syn_flood = 0.98, normal = 0.02</code>
          </div>
        </div>

        {/* Isolation Forest Anomaly Engine */}
        <div className="oz-landing-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#fef3c7", border: "1px solid #fde68a", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>ISOLATION FOREST</h3>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#d97706", fontWeight: 700 }}>UNSUPERVISED ANOMALY</span>
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
            Isolates behavioral outliers that deviate statistically from baseline traffic distributions without prior label training.
          </p>
          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px", fontFamily: "var(--font-mono)", color: "#334155" }}>
            ANOMALY SCORE: <code>-0.42 (statistical outlier)</code>
          </div>
        </div>
      </div>

      {/* Fusion Banner */}
      <div style={{ background: "#0f172a", color: "#ffffff", borderRadius: "20px", padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h4 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px 0" }}>EVIDENCE FUSION &amp; CORRELATION</h4>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Synthesizes multi-engine evidence vectors into single explainable alert verdicts.</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "var(--font-mono)", fontSize: "13px", color: "#10b981", fontWeight: 700 }}>
          <Zap size={16} /> VERDICT: THREAT CONFIRMED (96% CONFIDENCE)
        </div>
      </div>
    </section>
  );
};

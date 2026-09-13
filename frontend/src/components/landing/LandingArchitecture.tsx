import React from "react";

export const LandingArchitecture: React.FC = () => {
  return (
    <section className="oz-landing-section" id="architecture" style={{ background: "#f8fafc", borderRadius: "32px" }}>
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">SYSTEM ARCHITECTURE</span>
        <h2 className="oz-landing-section-heading">Technical flow topology.</h2>
        <p className="oz-landing-section-sub">
          High-performance decoupled pipeline designed for passive unidirectional IP traffic inspection.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "960px", margin: "0 auto" }}>
        {/* Row 1: Ingestion */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div className="oz-landing-card" style={{ padding: "20px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>INGESTION</span>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0 2px 0", color: "#0f172a" }}>Passive Network Tap</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Unidirectional L3/L4 header capture</p>
          </div>
          <div className="oz-landing-card" style={{ padding: "20px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>PROCESSING</span>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0 2px 0", color: "#0f172a" }}>Flow Window Aggregator</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Sliding window temporal grouping</p>
          </div>
          <div className="oz-landing-card" style={{ padding: "20px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>VECTORIZATION</span>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0 2px 0", color: "#0f172a" }}>Feature Extractor</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>18 statistical metric feature vectors</p>
          </div>
        </div>

        {/* Arrow Divider */}
        <div style={{ textAlign: "center", color: "#059669", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          ↓ PARALLEL MULTI-DETECTOR EVALUATION ↓
        </div>

        {/* Row 2: Detection Parallel */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div className="oz-landing-card" style={{ padding: "20px", borderLeft: "4px solid #059669" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#059669", fontWeight: 800 }}>DETECTOR 1</span>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0 2px 0", color: "#0f172a" }}>Rule Engine</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Threshold &amp; protocol signature evaluation</p>
          </div>
          <div className="oz-landing-card" style={{ padding: "20px", borderLeft: "4px solid #0284c7" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#0284c7", fontWeight: 800 }}>DETECTOR 2</span>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0 2px 0", color: "#0f172a" }}>Random Forest Classifier</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Supervised multi-class decision trees</p>
          </div>
          <div className="oz-landing-card" style={{ padding: "20px", borderLeft: "4px solid #d97706" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#d97706", fontWeight: 800 }}>DETECTOR 3</span>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "4px 0 2px 0", color: "#0f172a" }}>Isolation Forest Anomaly</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Unsupervised statistical outlier scoring</p>
          </div>
        </div>

        {/* Arrow Divider */}
        <div style={{ textAlign: "center", color: "#059669", fontWeight: 800, fontFamily: "var(--font-mono)", fontSize: "12px" }}>
          ↓ EVIDENCE CORRELATION &amp; DISPATCH ↓
        </div>

        {/* Row 3: Verdict & Alert */}
        <div className="oz-landing-card" style={{ background: "#0f172a", color: "#ffffff", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 800 }}>OUTPUT ENCLAVE</span>
            <h4 style={{ fontSize: "18px", fontWeight: 800, margin: "4px 0 2px 0", color: "#ffffff" }}>Fused Alert &amp; Explanation Dispatch</h4>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Broadcasting WebSocket alert events &amp; REST persistence sync</p>
          </div>
          <div style={{ background: "#059669", padding: "8px 16px", borderRadius: "9999px", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#ffffff" }}>
            SOC ANALYST READY
          </div>
        </div>
      </div>
    </section>
  );
};

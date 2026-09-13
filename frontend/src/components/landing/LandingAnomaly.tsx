import React from "react";

export const LandingAnomaly: React.FC = () => {
  return (
    <section className="oz-landing-section" style={{ background: "#0a0f1d", color: "#ffffff", borderRadius: "32px" }}>
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker" style={{ color: "#38bdf8" }}>UNSUPERVISED ANOMALY DETECTION</span>
        <h2 className="oz-landing-section-heading" style={{ color: "#ffffff" }}>
          Detect previously unclassified behavioral deviations.
        </h2>
        <p className="oz-landing-section-sub" style={{ color: "#94a3b8" }}>
          ORION-Z uses Isolation Forest models to isolate statistical feature vector anomalies from baseline network distributions.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", alignItems: "center" }}>
        {/* Scatter Visual Representation */}
        <div style={{ background: "#070b14", border: "1px solid #1e293b", borderRadius: "20px", padding: "24px", position: "relative", minHeight: "320px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "12px" }}>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700 }}>
              FEATURE SPACE DISTRIBUTIONS
            </span>
            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#fb7185", fontWeight: 700 }}>
              ANOMALY SCORE: -0.42
            </span>
          </div>

          {/* Scatter Points Representation */}
          <div style={{ position: "relative", height: "200px", width: "100%", margin: "20px 0" }}>
            {/* Normal Cluster */}
            <div style={{ position: "absolute", left: "25%", top: "35%", width: "120px", height: "80px", border: "1px stroke rgba(16, 185, 129, 0.4)", borderRadius: "50%", background: "rgba(16, 185, 129, 0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700 }}>NORMAL CLUSTER</span>
            </div>
            {/* Normal Dots */}
            <div style={{ position: "absolute", left: "30%", top: "45%", width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
            <div style={{ position: "absolute", left: "35%", top: "40%", width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
            <div style={{ position: "absolute", left: "28%", top: "52%", width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
            <div style={{ position: "absolute", left: "38%", top: "58%", width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />

            {/* Outlier Dots */}
            <div style={{ position: "absolute", right: "20%", top: "20%", width: "10px", height: "10px", borderRadius: "50%", background: "#f43f5e", boxShadow: "0 0 12px #f43f5e" }} />
            <div style={{ position: "absolute", right: "15%", top: "25%", fontSize: "10px", fontFamily: "var(--font-mono)", color: "#fb7185", fontWeight: 700 }}>
              OUTLIER (ANOMALOUS)
            </div>
          </div>

          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#64748b", textAlign: "center" }}>
            X-AXIS: SYN RATIO • Y-AXIS: DOMAIN ENTROPY
          </div>
        </div>

        {/* Technical Explanatory Points */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "20px", borderRadius: "14px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "#38bdf8" }}>
              Baseline Normal Clustering
            </h4>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
              Standard traffic features cluster densely in multi-dimensional space based on typical window ratios.
            </p>
          </div>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "20px", borderRadius: "14px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "#fb7185" }}>
              Isolation Path Length Scoring
            </h4>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
              Anomalous vectors require fewer random partition splits to isolate, yielding negative score values below -0.35.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

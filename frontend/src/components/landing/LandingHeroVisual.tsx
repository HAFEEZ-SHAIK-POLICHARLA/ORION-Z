import React from "react";
import { ShieldAlert, Zap } from "lucide-react";

export const LandingHeroVisual: React.FC = () => {
  return (
    <div style={{ padding: "0 24px 80px 24px", background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)" }}>
      <div className="oz-landing-hero-composition">
        <div className="oz-landing-composition-header">
          <div className="oz-landing-dots">
            <span className="oz-landing-dot oz-landing-dot-red" />
            <span className="oz-landing-dot oz-landing-dot-amber" />
            <span className="oz-landing-dot oz-landing-dot-green" />
          </div>
          <span className="oz-landing-composition-title">
            ORION-Z SYSTEM CONSOLE • HIGH-ASSURANCE THREAT LAB
          </span>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", background: "#0a0f1d", color: "#f8fafc" }}>
          {/* Top Status Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #1e293b", paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "#10b981", letterSpacing: "0.05em" }}>
                REPLAY ACTIVE • SYN FLOOD DEMO
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#94a3b8" }}>
              <span>LATENCY: <strong style={{ color: "#38bdf8" }}>0.82ms</strong></span>
              <span>EVENTS: <strong style={{ color: "#38bdf8" }}>4,820 /s</strong></span>
              <span>STATE: <strong style={{ color: "#10b981" }}>EVIDENCE CORRELATED</strong></span>
            </div>
          </div>

          {/* Core Graphic & Alert Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {/* Detection Card */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#f43f5e", fontWeight: 700, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldAlert size={14} /> THREAT CONFIRMED
                </span>
                <span style={{ padding: "2px 8px", borderRadius: "4px", background: "rgba(244, 63, 94, 0.2)", border: "1px solid rgba(244, 63, 94, 0.4)", color: "#fb7185", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  HIGH SEVERITY
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "0 0 4px 0" }}>SYN Flood Attack</h3>
                <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>High-volume half-open TCP connections targeting port 80</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#070b14", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "var(--font-mono)" }}>CONFIDENCE</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#10b981" }}>96%</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "#64748b", fontFamily: "var(--font-mono)" }}>RULE MATCH</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#38bdf8" }}>R-102_SYN</div>
                </div>
              </div>
            </div>

            {/* Evidence Breakdown Grid */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: 700, letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "6px" }}>
                <Zap size={14} /> EVIDENTIAL FEATURES & REASONING
              </span>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ background: "#070b14", border: "1px solid #1e293b", padding: "10px 12px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#cbd5e1" }}>syn_ratio_window</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#fb7185", fontWeight: 700 }}>0.94 (&gt; 0.70 threshold)</span>
                </div>
                <div style={{ background: "#070b14", border: "1px solid #1e293b", padding: "10px 12px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#cbd5e1" }}>incomplete_handshakes</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#fb7185", fontWeight: 700 }}>1,240 /s</span>
                </div>
                <div style={{ background: "#070b14", border: "1px solid #1e293b", padding: "10px 12px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#cbd5e1" }}>random_forest_classification</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700 }}>syn_flood (p=0.98)</span>
                </div>
                <div style={{ background: "#070b14", border: "1px solid #1e293b", padding: "10px 12px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#cbd5e1" }}>isolation_forest_anomaly</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#38bdf8", fontWeight: 700 }}>score = -0.42 (anomalous)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

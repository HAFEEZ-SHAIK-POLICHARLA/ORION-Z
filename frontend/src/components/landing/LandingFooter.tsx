import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { OrionZHeaderMark } from "../OrionZHeaderMark";

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer style={{ background: "#0a0f1d", color: "#ffffff", borderTop: "1px solid #1e293b", paddingTop: "80px", paddingBottom: "40px" }}>
      {/* Final High-Impact CTA Box */}
      <div style={{ maxWidth: "1000px", margin: "0 auto 80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(180deg, #0f172a 0%, #070b14 100%)", border: "1px solid #1e293b", borderRadius: "32px", padding: "64px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "9999px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
            <ShieldCheck size={14} />
            <span>SIH26145 HIGH-ASSURANCE NDR</span>
          </div>

          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", color: "#ffffff", lineHeight: 1.1 }}>
            Turn network traffic into <br />
            <span style={{ background: "linear-gradient(135deg, #10b981 0%, #38bdf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              security intelligence.
            </span>
          </h2>

          <p style={{ fontSize: "16px", color: "#94a3b8", maxWidth: "600px", margin: 0, lineHeight: 1.6 }}>
            Experience passive network threat detection, hybrid rule/ML classification, and explainable local evidence correlation.
          </p>

          <button
            className="oz-landing-btn-primary"
            style={{ padding: "16px 36px", fontSize: "16px", background: "#10b981", color: "#0f172a", fontWeight: 800 }}
            onClick={() => navigate("/threatlab")}
          >
            <span>LAUNCH THREAT LAB</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Footer Navigation Columns */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px 40px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "40px", borderBottom: "1px solid #1e293b" }}>
        {/* Col 1: Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <OrionZHeaderMark size={32} />
            <span style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff" }}>ORION-Z</span>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            SIH26145 — AI-Based Detection of Cyber Threats in Unidirectional IP Traffic.
          </p>
        </div>

        {/* Col 2: Platform Links */}
        <div>
          <h4 style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "#94a3b8", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "16px" }}>
            PLATFORM ROUTES
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/threatlab"); }} style={{ color: "#cbd5e1", textDecoration: "none" }}>Threat Lab Sandbox</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/lab-results"); }} style={{ color: "#cbd5e1", textDecoration: "none" }}>Lab Results History</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} style={{ color: "#cbd5e1", textDecoration: "none" }}>Operations Dashboard</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/realtime"); }} style={{ color: "#cbd5e1", textDecoration: "none" }}>Real-Time Live Tap</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate("/system-health"); }} style={{ color: "#cbd5e1", textDecoration: "none" }}>System Health &amp; Diagnostics</a></li>
          </ul>
        </div>

        {/* Col 3: Detection Capabilities */}
        <div>
          <h4 style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "#94a3b8", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "16px" }}>
            DETECTION SUITE
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#64748b" }}>
            <li>SYN Flood &amp; DoS Detection</li>
            <li>Port Scanning Reconnaissance</li>
            <li>DNS Tunnelling &amp; High Entropy</li>
            <li>DGA Domain Generation</li>
            <li>Botnet C2 Beaconing</li>
            <li>Isolation Forest Anomaly Scoring</li>
          </ul>
        </div>

        {/* Col 4: Enclave Compliance */}
        <div>
          <h4 style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "#94a3b8", fontWeight: 800, letterSpacing: "0.08em", marginBottom: "16px" }}>
            HIGH ASSURANCE
          </h4>
          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, margin: 0 }}>
            Engineered specifically for unidirectional security gateways, passive TAP enclaves, and strict isolation requirements.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div style={{ maxWidth: "1280px", margin: "24px auto 0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
        <span>© 2026 ORION-Z (SIH26145). All rights reserved.</span>
        <span>PASSIVE UNIDIRECTIONAL NDR SYSTEM</span>
      </div>
    </footer>
  );
};

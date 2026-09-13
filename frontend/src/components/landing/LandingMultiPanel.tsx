import React, { useState } from "react";
import { Terminal, Database, Activity, FileText } from "lucide-react";

export const LandingMultiPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"lab" | "results" | "dashboard" | "drawer">("lab");

  return (
    <section className="oz-landing-section">
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">PRODUCT COMPOSITION</span>
        <h2 className="oz-landing-section-heading">
          Integrated security platform.
        </h2>
        <p className="oz-landing-section-sub">
          Explore ORION-Z's unified workspace modules designed for high-assurance network operations.
        </p>
      </div>

      {/* Module Selector */}
      <div className="oz-landing-threat-selector">
        <button
          className={`oz-landing-threat-tab ${activeTab === "lab" ? "active" : ""}`}
          onClick={() => setActiveTab("lab")}
        >
          <Terminal size={14} style={{ display: "inline", marginRight: "6px" }} />
          THREAT LAB
        </button>
        <button
          className={`oz-landing-threat-tab ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          <Database size={14} style={{ display: "inline", marginRight: "6px" }} />
          LAB RESULTS
        </button>
        <button
          className={`oz-landing-threat-tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <Activity size={14} style={{ display: "inline", marginRight: "6px" }} />
          OPERATIONS DASHBOARD
        </button>
        <button
          className={`oz-landing-threat-tab ${activeTab === "drawer" ? "active" : ""}`}
          onClick={() => setActiveTab("drawer")}
        >
          <FileText size={14} style={{ display: "inline", marginRight: "6px" }} />
          ANALYST DRAWER
        </button>
      </div>

      {/* Overlapping Interface Canvas */}
      <div className="oz-landing-hero-composition" style={{ minHeight: "420px", background: "#0a0f1d", color: "#ffffff", padding: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "16px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#059669" }} />
            <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "#10b981", fontWeight: 700 }}>
              MODULE PREVIEW • {activeTab.toUpperCase()} VIEW
            </span>
          </div>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#64748b" }}>
            ORION-Z V2 APP SHELL
          </span>
        </div>

        {activeTab === "lab" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "#ffffff" }}>Threat Lab Replay Console</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              Replays 9 pre-built attack fixtures at adjustable speeds (1x to 50x) with cinematic SVG timeline explanations and real-time backend metric streams.
            </p>
            <div style={{ background: "#070b14", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#38bdf8" }}>
              SCENARIOS: syn_flood | port_scanning | dns_tunnelling | dga | beaconing | encrypted_session | exfiltration | udp_amplification | slowloris
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "#ffffff" }}>Lab Results (Simulation Domain)</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              Displays detection history strictly tagged with <code>source_mode = "simulation"</code>, keeping controlled test events separate from live operations.
            </p>
            <div style={{ background: "#070b14", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#10b981" }}>
              SIMULATION ALERTS: 100% ISOLATED • REST SYNC RECOVERY ACTIVE
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "#ffffff" }}>Operations Dashboard (Live Domain)</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              Real-time monitoring panel displaying alerts strictly tagged with <code>source_mode = "live"</code> from passive network tap sensors.
            </p>
            <div style={{ background: "#070b14", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#38bdf8" }}>
              LIVE SENSOR TAP: PASSIVE HEADER CAPTURE • ZERO LATENCY PENALTY
            </div>
          </div>
        )}

        {activeTab === "drawer" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: "#ffffff" }}>Analyst Investigation Drawer</h3>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              Deep-dive investigation panel displaying telemetry, feature values, rule matches, ML probabilities, and local LLM explanation reasoning.
            </p>
            <div style={{ background: "#070b14", border: "1px solid #1e293b", borderRadius: "12px", padding: "16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#fb7185" }}>
              ANALYST DRAWER: FULL EVIDENTIAL CONTEXT &amp; TELEMETRY DEREFERENCING
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

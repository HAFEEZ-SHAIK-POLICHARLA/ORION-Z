import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, WifiOff } from "lucide-react";

export const LandingRealTime: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<"safe" | "unsafe" | "offline">("safe");

  return (
    <section className="oz-landing-section" style={{ background: "#f8fafc", borderRadius: "32px" }}>
      <div className="oz-landing-section-header">
        <span className="oz-landing-section-kicker">REAL-TIME OPERATIONS DEMONSTRATION</span>
        <h2 className="oz-landing-section-heading">
          Watch the network as it happens.
        </h2>
        <p className="oz-landing-section-sub">
          ORION-Z distinguishes passive live network telemetry from controlled Threat Lab simulations.
          Explore the presentation states below:
        </p>
      </div>

      {/* State Switcher Tabs */}
      <div className="oz-landing-threat-selector">
        <button
          className={`oz-landing-threat-tab ${selectedMode === "safe" ? "active" : ""}`}
          onClick={() => setSelectedMode("safe")}
        >
          <ShieldCheck size={14} style={{ display: "inline", marginRight: "6px" }} />
          SAFE STATE
        </button>
        <button
          className={`oz-landing-threat-tab ${selectedMode === "unsafe" ? "active" : ""}`}
          onClick={() => setSelectedMode("unsafe")}
        >
          <AlertTriangle size={14} style={{ display: "inline", marginRight: "6px" }} />
          UNSAFE STATE
        </button>
        <button
          className={`oz-landing-threat-tab ${selectedMode === "offline" ? "active" : ""}`}
          onClick={() => setSelectedMode("offline")}
        >
          <WifiOff size={14} style={{ display: "inline", marginRight: "6px" }} />
          SENSOR NOT CONNECTED
        </button>
      </div>

      {/* Presentation Display Box */}
      <div className="oz-landing-card" style={{ maxWidth: "800px", margin: "0 auto", padding: "36px", textAlign: "center" }}>
        {selectedMode === "safe" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ecfdf5", border: "2px solid #a7f3d0", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={32} />
            </div>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#059669", letterSpacing: "0.08em" }}>
              STATUS: SAFE • NOMINAL TRAFFIC
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Passive Live Tap Active
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "540px", margin: 0, lineHeight: 1.6 }}>
              All packet streams are within baseline bounds. Zero threat indicators or anomalous flow deviations detected across the unidirectional tap.
            </p>
          </div>
        )}

        {selectedMode === "unsafe" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fef2f2", border: "2px solid #fecaca", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={32} />
            </div>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#dc2626", letterSpacing: "0.08em" }}>
              STATUS: UNSAFE • ACTIVE THREAT DETECTED
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              SYN Flood Threat Detected
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "540px", margin: 0, lineHeight: 1.6 }}>
              Live telemetry indicates high-density incomplete handshakes targeting port 80. Immediate analyst inspection drawer triggered.
            </p>
          </div>
        )}

        {selectedMode === "offline" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fffbeb", border: "2px solid #fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <WifiOff size={32} />
            </div>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#d97706", letterSpacing: "0.08em" }}>
              STATUS: SENSOR NOT CONNECTED
            </span>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Live Sensor Prerequisites Required
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "540px", margin: 0, lineHeight: 1.6 }}>
              Passive tap capture requires administrator privileges and Npcap packet driver installation on host hardware.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

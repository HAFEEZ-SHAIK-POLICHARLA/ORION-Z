import React from "react";
import { Link } from "react-router-dom";
import { Activity, Database, ShieldCheck, Sparkles, Radio } from "lucide-react";
import type { Metrics, RealtimeMetrics } from "../types";
import { OrionZHeaderMark } from "./OrionZHeaderMark";

interface HeaderProps {
  connected: boolean;
  metrics: Metrics;
  realtimeMetrics: RealtimeMetrics | null;
  appwriteConfigured: boolean;
  appwriteReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  metrics,
  realtimeMetrics,
  appwriteConfigured,
  appwriteReady,
}) => {
  const liveStatus = realtimeMetrics?.status ?? "STOPPED";
  const liveSafe = realtimeMetrics?.system_state === "SAFE";

  return (
    <header className="v2-header">
      <Link
        to="/"
        className="v2-brand-section"
        style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
        aria-label="ORION-Z Home"
      >
        <div className="v2-brand-logo-wrap">
          <OrionZHeaderMark size={36} />
        </div>
        <div className="v2-brand-titles">
          <span className="v2-brand-kicker">SIH26145 / NTRO / Z-Fighters</span>
          <h1 className="v2-brand-name">ORION-Z</h1>
        </div>
      </Link>

      <div className="v2-header-badges">
        {/* Real-Time Passive Tap Indicator */}
        <div
          className={`v2-status-badge ${
            liveStatus === "RUNNING_LIVE"
              ? liveSafe
                ? "badge-live-safe"
                : "badge-live-unsafe"
              : liveStatus === "PASSIVE_TAP_UNAVAILABLE"
              ? "badge-warning"
              : "badge-off"
          }`}
          title="Passive Network Capture Engine Status"
        >
          <Radio size={13} className={liveStatus === "RUNNING_LIVE" ? "pulse-icon" : ""} />
          <span>
            {liveStatus === "RUNNING_LIVE"
              ? `LIVE TAP: ${realtimeMetrics?.system_state}`
              : liveStatus === "PASSIVE_TAP_UNAVAILABLE"
              ? "TAP: UNAVAILABLE"
              : "TAP: STOPPED"}
          </span>
        </div>

        {/* Threat Lab Replay Indicator */}
        <div className={`v2-status-badge ${metrics.running ? "badge-lab-active" : "badge-off"}`}>
          <Activity size={13} />
          <span>THREAT LAB: {metrics.running ? (metrics.scenario || "ACTIVE").toUpperCase() : "IDLE"}</span>
        </div>

        {/* Appwrite Status */}
        {appwriteConfigured && (
          <div className={`v2-status-badge ${appwriteReady ? "badge-ok" : "badge-off"}`}>
            <Database size={13} />
            <span>APPWRITE {appwriteReady ? "OK" : "OFF"}</span>
          </div>
        )}

        {/* Ollama Status */}
        <div className={`v2-status-badge ${metrics.ollama_status?.available ? "badge-ok" : "badge-off"}`}>
          <Sparkles size={13} />
          <span>OLLAMA {metrics.ollama_status?.available ? metrics.ollama_status.model : "OFF"}</span>
        </div>

        {/* WebSocket Connection */}
        <div className={`v2-status-badge ${connected ? "badge-ok" : "badge-warning"}`}>
          <ShieldCheck size={13} />
          <span>{connected ? "WEBSOCKET ONLINE" : "RECONNECTING"}</span>
        </div>
      </div>
    </header>
  );
};

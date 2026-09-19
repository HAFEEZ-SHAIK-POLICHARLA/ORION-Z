import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Radio,
  Gauge,
  Search,
  CheckCircle2,
  XCircle,
  WifiOff,
  Shield,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Alert, RealtimeMetrics } from "../types";

interface DashboardViewProps {
  realtimeMetrics: RealtimeMetrics | null;
  /** Only live-tagged alerts (source_mode === "live"). App.tsx filters before passing. */
  liveAlerts: Alert[];
  liveTimeline: { time: string; alerts: number }[];
  selectedAlert: Alert | null;
  onSelectAlert: (alert: Alert | null) => void;
}

const HUMAN_THREAT: Record<string, string> = {
  syn_flood: "SYN Flood Attack",
  port_scanning: "TCP/UDP Port Scanning",
  dns_tunnelling: "DNS Data Tunnelling",
  dga: "DGA Domain Generation",
  beaconing: "Botnet C2 Beaconing",
  encrypted_session: "Encrypted Session Anomaly",
  exfiltration: "Data Exfiltration",
  udp_amplification: "UDP Amplification",
  slowloris: "Slowloris HTTP Exhaustion",
  ddos: "DDoS Flood Attack",
  unknown_anomaly: "Unclassified Behavioral Anomaly",
};

type LiveOperationalState =
  | "BACKEND_UNAVAILABLE"
  | "SENSOR_NOT_CONNECTED"
  | "ENGINE_STOPPED"
  | "SENSOR_UNAVAILABLE"
  | "LIVE_MONITORING_SAFE"
  | "LIVE_MONITORING_UNSAFE";

function resolveOperationalState(rm: RealtimeMetrics | null): LiveOperationalState {
  if (!rm) return "BACKEND_UNAVAILABLE";
  if (rm.status === "PASSIVE_TAP_UNAVAILABLE") return "SENSOR_UNAVAILABLE";
  if (!rm.running) return "ENGINE_STOPPED";
  if (rm.status === "RUNNING_LIVE" && rm.running) {
    return rm.system_state === "UNSAFE" ? "LIVE_MONITORING_UNSAFE" : "LIVE_MONITORING_SAFE";
  }
  return "SENSOR_NOT_CONNECTED";
}

const STATE_META: Record<
  LiveOperationalState,
  { label: string; sub: string; icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  BACKEND_UNAVAILABLE: {
    label: "BACKEND UNAVAILABLE",
    sub: "Cannot reach the ORION-Z detection backend. Ensure the FastAPI service is running.",
    icon: <WifiOff size={22} />,
    color: "var(--status-warning)",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
  },
  SENSOR_NOT_CONNECTED: {
    label: "LIVE SENSOR NOT CONNECTED",
    sub: "Start the detection engine on the Real-Time Detection page to begin live monitoring.",
    icon: <Radio size={22} />,
    color: "var(--text-secondary)",
    bg: "var(--surface-1)",
    border: "var(--border-subtle)",
  },
  ENGINE_STOPPED: {
    label: "DETECTION ENGINE STOPPED",
    sub: "The ORION-Z passive capture engine is not running. Navigate to Real-Time Detection to start it.",
    icon: <Cpu size={22} />,
    color: "var(--text-secondary)",
    bg: "var(--surface-1)",
    border: "var(--border-subtle)",
  },
  SENSOR_UNAVAILABLE: {
    label: "LIVE SENSOR UNAVAILABLE",
    sub: "Sensor prerequisites not met. Install Npcap and run the backend with Administrator privileges.",
    icon: <WifiOff size={22} />,
    color: "var(--status-warning)",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
  },
  LIVE_MONITORING_SAFE: {
    label: "LIVE MONITORING ACTIVE — NO ACTIVE THREATS",
    sub: "ORION-Z is actively monitoring the network. No qualifying threats detected in the current window.",
    icon: <Shield size={22} />,
    color: "var(--accent-mint)",
    bg: "rgba(42, 254, 183, 0.08)",
    border: "var(--border-mint)",
  },
  LIVE_MONITORING_UNSAFE: {
    label: "LIVE MONITORING — ACTIVE THREATS DETECTED",
    sub: "ORION-Z has detected qualifying network threats. Review the live alert stream below.",
    icon: <ShieldAlert size={22} />,
    color: "var(--status-critical)",
    bg: "rgba(255, 59, 48, 0.12)",
    border: "rgba(255, 59, 48, 0.35)",
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  realtimeMetrics: rm,
  liveAlerts,
  liveTimeline,
  selectedAlert,
  onSelectAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [triageMap, setTriageMap] = useState<Record<string, "ACTIVE" | "ACKNOWLEDGED">>({});

  const operationalState = resolveOperationalState(rm);
  const stateMeta = STATE_META[operationalState];
  const isMonitoring =
    operationalState === "LIVE_MONITORING_SAFE" || operationalState === "LIVE_MONITORING_UNSAFE";

  // KPI values — only meaningful when live monitoring is active
  const flowsProcessed = isMonitoring ? (rm?.flows_processed ?? 0) : null;
  const activeIncidents = isMonitoring ? (rm?.active_incidents ?? 0) : null;
  const detectionLatency = isMonitoring ? (rm?.detection_time_ms ?? 0) : null;
  const engineUptime = isMonitoring ? (rm?.engine_uptime_seconds ?? 0) : null;

  const criticalCount = liveAlerts.filter((a) => a.severity === "critical").length;
  const highCount = liveAlerts.filter((a) => a.severity === "high").length;

  // Build live threat distribution from live alerts
  const liveThreats: Record<string, number> = {};
  liveAlerts.forEach((a) => {
    liveThreats[a.threat_class] = (liveThreats[a.threat_class] ?? 0) + 1;
  });

  const filteredAlerts = liveAlerts.filter((alert) => {
    const matchesSev = severityFilter === "all" || alert.severity === severityFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      alert.threat_class.toLowerCase().includes(q) ||
      alert.source_ip.includes(q) ||
      alert.destination_ip.includes(q) ||
      alert.detector.toLowerCase().includes(q);
    return matchesSev && matchesSearch;
  });

  const handleToggleTriage = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTriageMap((prev) => ({
      ...prev,
      [alertId]: prev[alertId] === "ACKNOWLEDGED" ? "ACTIVE" : "ACKNOWLEDGED",
    }));
  };

  const formatUptime = (secs: number | null) => {
    if (secs === null) return "—";
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m < 60 ? `${m}m ${s}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  return (
    <div className="v2-page-section">
      {/* 1. PAGE TITLE */}
      <div className="v2-page-header">
        <div>
          <span className="v2-kicker">LIVE OPERATIONS</span>
          <h2 className="v2-page-title">Dashboard</h2>
          <p className="v2-page-subtitle">
            Real-time operational state from the ORION-Z live sensor and detection engine.
          </p>
        </div>
        <div className="v2-header-meta">
          <span
            className="v2-meta-tag"
            style={{
              background: isMonitoring ? "#ecfdf5" : "#f8fafc",
              color: isMonitoring ? "#047857" : "#64748b",
              borderColor: isMonitoring ? "#a7f3d0" : "#cbd5e1",
            }}
          >
            <Radio size={12} style={{ marginRight: "4px" }} />
            {isMonitoring
              ? `LIVE TAP: ${rm?.interface_name ?? "ACTIVE"}`
              : "LIVE TAP: INACTIVE"}
          </span>
        </div>
      </div>

      {/* 2. OPERATIONAL STATE BANNER */}
      <div
        className="v2-sensor-state-panel"
        style={{
          background: stateMeta.bg,
          borderColor: stateMeta.border,
          color: stateMeta.color,
        }}
      >
        <div className="v2-sensor-state-icon" style={{ color: stateMeta.color }}>
          {stateMeta.icon}
        </div>
        <div>
          <div className="v2-sensor-state-label">{stateMeta.label}</div>
          <div className="v2-sensor-state-sub">{stateMeta.sub}</div>
        </div>
        {isMonitoring && (
          <div className="v2-sensor-active-indicators">
            <span className="v2-live-dot" />
            <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#047857" }}>
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* 3. LIVE KPI STRIP */}
      <div className="v2-grid-4">
        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Flows Processed</span>
            <Activity size={18} className="text-emerald" />
          </div>
          <div className="v2-stat-value">
            {flowsProcessed === null ? "—" : flowsProcessed.toLocaleString()}
          </div>
          <div className="v2-stat-sub">
            {isMonitoring ? `Interface: ${rm?.interface_name ?? "active"}` : "Live sensor not active"}
          </div>
        </div>

        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Active Threats</span>
            <AlertTriangle size={18} className="text-amber" />
          </div>
          <div className="v2-stat-value">
            {activeIncidents === null ? "—" : activeIncidents}
          </div>
          <div className="v2-stat-sub">
            {activeIncidents === null
              ? "Live sensor not active"
              : `${criticalCount} Critical · ${highCount} High`}
          </div>
        </div>

        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Live Alerts</span>
            <AlertTriangle size={18} className="text-red" />
          </div>
          <div className="v2-stat-value">{isMonitoring ? liveAlerts.length : "—"}</div>
          <div className="v2-stat-sub">
            {isMonitoring ? "Alerts from live sensor in session" : "Live sensor not active"}
          </div>
        </div>

        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Detection Latency</span>
            <Gauge size={18} className="text-emerald" />
          </div>
          <div className="v2-stat-value">
            {detectionLatency === null ? "—" : `${detectionLatency.toFixed(1)} ms`}
          </div>
          <div className="v2-stat-sub">
            {isMonitoring ? `Engine uptime: ${formatUptime(engineUptime)}` : "Target SLA: < 2000 ms"}
          </div>
        </div>
      </div>

      {/* 4. LIVE DETECTION ACTIVITY + THREAT DISTRIBUTION */}
      <div className="v2-grid-analytics">
        {/* Live Detection Timeline */}
        <div className="v2-section-frame">
          <div className="v2-frame-header">
            <div className="v2-frame-title-wrap">
              <span className="v2-frame-kicker">LIVE TELEMETRY STREAM</span>
              <h3 className="v2-frame-title">Detection Velocity</h3>
            </div>
          </div>
          <div style={{ height: "240px", width: "100%" }}>
            {!isMonitoring ? (
              <div className="v2-sensor-offline-state">
                <WifiOff size={32} />
                <span>Live sensor not active — no telemetry to display.</span>
                <span className="v2-offline-hint">Start the engine on the Real-Time Detection page.</span>
              </div>
            ) : liveTimeline.length === 0 ? (
              <div className="v2-empty-state" style={{ paddingTop: "60px" }}>
                Monitoring active — no live detections yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveTimeline}>
                  <defs>
                    <linearGradient id="liveAreaGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" stroke="#667585" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#667585" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#0b131e",
                      border: "1px solid rgba(0, 229, 255, 0.3)",
                      borderRadius: "8px",
                      color: "#f4f7fa",
                      fontSize: "12px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    name="Live Alerts"
                    stroke="#00e5ff"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#liveAreaGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Threat Distribution */}
        <div className="v2-section-frame">
          <div className="v2-frame-header">
            <div className="v2-frame-title-wrap">
              <span className="v2-frame-kicker">LIVE CLASSIFICATION</span>
              <h3 className="v2-frame-title">Active Threat Distribution</h3>
            </div>
          </div>
          <div className="v2-distribution-list">
            {!isMonitoring ? (
              <div className="v2-empty-state">
                Live sensor not active. Threat distribution requires active monitoring.
              </div>
            ) : Object.keys(liveThreats).length === 0 ? (
              <div className="v2-empty-state">
                Monitoring active — no live threat classifications recorded.
              </div>
            ) : (
              Object.entries(liveThreats).map(([threat, count]) => {
                const pct = Math.round((count / liveAlerts.length) * 100);
                return (
                  <div key={threat} className="v2-dist-row">
                    <div className="v2-dist-top">
                      <span className="v2-dist-name">{HUMAN_THREAT[threat] || threat}</span>
                      <span className="v2-dist-count">{count} ({pct}%)</span>
                    </div>
                    <div className="v2-dist-track">
                      <div className="v2-dist-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. LIVE ALERT STREAM */}
      <div className="v2-section-frame">
        <div className="v2-frame-header">
          <div className="v2-frame-title-wrap">
            <span className="v2-frame-kicker">LIVE ALERT STREAM</span>
            <h3 className="v2-frame-title">Operational Incident Feed</h3>
          </div>
          <div className="v2-table-filters">
            <div className="v2-search-box">
              <Search size={14} className="v2-search-icon" />
              <input
                type="text"
                placeholder="Search IP, Threat, Detector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="v2-select-box">
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="v2-table-wrap">
          <table className="v2-table">
            <thead>
              <tr>
                <th>SOURCE</th>
                <th>STATUS</th>
                <th>SEVERITY</th>
                <th>THREAT CLASS</th>
                <th>SOURCE IP</th>
                <th>DESTINATION IP</th>
                <th>CONFIDENCE</th>
                <th>TIMESTAMP</th>
                <th>TRIAGE</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="v2-table-empty">
                    {liveAlerts.length === 0
                      ? isMonitoring
                        ? "LIVE MONITORING ACTIVE — No live alerts detected yet."
                        : "LIVE SENSOR NOT ACTIVE — No live alerts to display."
                      : "No live alerts matching current filter."}
                  </td>
                </tr>
              ) : (
                filteredAlerts.slice(0, 25).map((alert) => {
                  const state = triageMap[alert.alert_id] ?? "ACTIVE";
                  const isAck = state === "ACKNOWLEDGED";

                  return (
                    <tr
                      key={alert.alert_id}
                      className={`${selectedAlert?.alert_id === alert.alert_id ? "selected" : ""} ${
                        isAck ? "acknowledged" : ""
                      }`}
                      onClick={() => onSelectAlert(alert)}
                    >
                      <td>
                        {/* Always LIVE in this view — source_mode filter is strict */}
                        <span className="v2-source-badge live">LIVE TAP</span>
                      </td>
                      <td>
                        <span className={`v2-triage-badge ${isAck ? "ack" : "active"}`}>
                          {state}
                        </span>
                      </td>
                      <td>
                        <span className={`v2-badge-sev ${alert.severity}`}>{alert.severity}</span>
                      </td>
                      <td>
                        <div className="v2-cell-threat">
                          <strong>{HUMAN_THREAT[alert.threat_class] || alert.threat_class}</strong>
                          <span className="v2-cell-sub">{alert.detector}</span>
                        </div>
                      </td>
                      <td className="v2-mono-cell">{alert.source_ip}</td>
                      <td className="v2-mono-cell">{alert.destination_ip}</td>
                      <td>
                        <div className="v2-confidence-wrap">
                          <div className="v2-confidence-track">
                            <div
                              className="v2-confidence-fill"
                              style={{ width: `${Math.round(alert.confidence * 100)}%` }}
                            />
                          </div>
                          <span>{Math.round(alert.confidence * 100)}%</span>
                        </div>
                      </td>
                      <td className="v2-mono-cell">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </td>
                      <td>
                        <button
                          className={`v2-btn-triage ${isAck ? "ack" : ""}`}
                          onClick={(e) => handleToggleTriage(alert.alert_id, e)}
                          title={isAck ? "Re-open incident" : "Acknowledge incident"}
                        >
                          {isAck ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                          <span>{isAck ? "Reopen" : "Ack"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

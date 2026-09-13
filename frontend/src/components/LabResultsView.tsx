import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  FlaskConical,
  Gauge,
  Search,
  CheckCircle2,
  XCircle,
  BeakerIcon,
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
import type { Alert, Metrics } from "../types";

interface LabResultsViewProps {
  metrics: Metrics;
  /** Only simulation-tagged alerts (source_mode === "simulation"). App.tsx filters before passing. */
  simAlerts: Alert[];
  timeline: { time: string; alerts: number }[];
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

export const LabResultsView: React.FC<LabResultsViewProps> = ({
  metrics,
  simAlerts,
  timeline,
  selectedAlert,
  onSelectAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [triageMap, setTriageMap] = useState<Record<string, "ACTIVE" | "ACKNOWLEDGED">>({});

  const labRunning = metrics.running ?? false;

  const totalFlows = metrics.processed_events || 0;
  const totalDetections = metrics.alerts_generated || 0;
  const avgLatency = metrics.average_alert_latency_ms || 0;

  const criticalCount = simAlerts.filter((a) => a.severity === "critical").length;
  const highCount = simAlerts.filter((a) => a.severity === "high").length;

  const filteredAlerts = simAlerts.filter((alert) => {
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

  return (
    <div className="v2-page-section">
      {/* 1. PAGE TITLE */}
      <div className="v2-page-header">
        <div>
          <span className="v2-kicker">CONTROLLED SIMULATION ANALYTICS</span>
          <h2 className="v2-page-title">Lab Results</h2>
          <p className="v2-page-subtitle">
            Threat Lab replay results and detection outcomes from ORION-Z controlled scenarios.
          </p>
        </div>
        <div className="v2-header-meta" style={{ gap: "8px", alignItems: "flex-start" }}>
          {/* Simulation source badge */}
          <span className="v2-simulation-badge">
            <FlaskConical size={12} style={{ marginRight: "5px" }} />
            SIMULATION
          </span>
          {/* Scenario context */}
          <span
            className="v2-meta-tag"
            style={{ background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" }}
          >
            <FlaskConical size={12} style={{ marginRight: "4px" }} />
            {labRunning
              ? `REPLAYING: ${(metrics.scenario ?? "SCENARIO").toUpperCase()}`
              : metrics.scenario
              ? `LAST RUN: ${metrics.scenario.toUpperCase()}`
              : "THREAT LAB: IDLE"}
          </span>
        </div>
      </div>

      {/* 2. SIMULATION KPI STRIP */}
      <div className="v2-grid-4">
        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Simulation Flows Processed</span>
            <Activity size={18} className="text-emerald" />
          </div>
          <div className="v2-stat-value">{totalFlows.toLocaleString()}</div>
          <div className="v2-stat-sub">
            {labRunning
              ? `${metrics.events_per_second} flows/sec — replay active`
              : metrics.scenario
              ? `From scenario: ${metrics.scenario}`
              : "No simulation run yet"}
          </div>
        </div>

        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Simulation Threats Detected</span>
            <AlertTriangle size={18} className="text-amber" />
          </div>
          <div className="v2-stat-value">{totalDetections.toLocaleString()}</div>
          <div className="v2-stat-sub">{simAlerts.length} simulation alerts in session</div>
        </div>

        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Lab Alerts by Severity</span>
            <AlertTriangle size={18} className="text-red" />
          </div>
          <div className="v2-stat-value">{criticalCount + highCount}</div>
          <div className="v2-stat-sub">
            {criticalCount} Critical · {highCount} High
          </div>
        </div>

        <div className="v2-stat-card">
          <div className="v2-stat-top">
            <span className="v2-stat-label">Simulation Detection Latency</span>
            <Gauge size={18} className="text-emerald" />
          </div>
          <div className="v2-stat-value">
            {totalDetections === 0 ? "—" : `${avgLatency.toFixed(1)} ms`}
          </div>
          <div className="v2-stat-sub">Target SLA: &lt; 2000 ms</div>
        </div>
      </div>

      {/* 3. DETECTION VELOCITY + THREAT DISTRIBUTION */}
      <div className="v2-grid-analytics">
        {/* Detection Timeline */}
        <div className="v2-section-frame">
          <div className="v2-frame-header">
            <div className="v2-frame-title-wrap">
              <span className="v2-frame-kicker">SIMULATION TELEMETRY</span>
              <h3 className="v2-frame-title">Detection Velocity</h3>
            </div>
          </div>
          <div style={{ height: "240px", width: "100%" }}>
            {timeline.length === 0 ? (
              <div className="v2-empty-state" style={{ paddingTop: "60px" }}>
                No simulation detections recorded yet. Run a Threat Lab scenario to populate this chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="labAreaGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      color: "#0f172a",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    name="Detections"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#labAreaGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Threat Class Distribution */}
        <div className="v2-section-frame">
          <div className="v2-frame-header">
            <div className="v2-frame-title-wrap">
              <span className="v2-frame-kicker">SCENARIO CLASSIFICATION</span>
              <h3 className="v2-frame-title">Threat Breakdown</h3>
            </div>
          </div>
          <div className="v2-distribution-list">
            {Object.keys(metrics.threat_counts).length === 0 ? (
              <div className="v2-empty-state">
                No threat detections recorded. Run a Threat Lab scenario to see the breakdown.
              </div>
            ) : (
              Object.entries(metrics.threat_counts).map(([threat, count]) => {
                const pct = Math.round((count / (totalDetections || 1)) * 100);
                return (
                  <div key={threat} className="v2-dist-row">
                    <div className="v2-dist-top">
                      <span className="v2-dist-name">{HUMAN_THREAT[threat] || threat}</span>
                      <span className="v2-dist-count">{count} ({pct}%)</span>
                    </div>
                    <div className="v2-dist-track">
                      <div className="v2-dist-fill" style={{ width: `${pct}%`, background: "#d97706" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. SIMULATION ALERT STREAM */}
      <div className="v2-section-frame">
        <div className="v2-frame-header">
          <div className="v2-frame-title-wrap">
            <span className="v2-frame-kicker">SIMULATION ALERT STREAM</span>
            <h3 className="v2-frame-title">Lab Detection Results</h3>
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
                    {simAlerts.length === 0
                      ? "NO SIMULATION RESULTS YET — Run a Threat Lab scenario to generate detection results."
                      : "No simulation alerts matching current filter."}
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
                        {/* Always SIMULATION in this view — source_mode filter is strict */}
                        <span className="v2-source-badge simulation">THREAT LAB</span>
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

// Suppress unused import warning — BeakerIcon is available for future use
void (BeakerIcon as unknown);

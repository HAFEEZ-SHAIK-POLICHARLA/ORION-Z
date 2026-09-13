import { useMemo, useState } from "react";
import { AlertTriangle, Filter, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Alert } from "../types";

const SCENARIO_DISPLAY_NAMES: Record<string, string> = {
  syn_flood: "SYN Flood",
  port_scanning: "Port Scanning",
  dns_tunnelling: "DNS Tunnelling",
  dga: "DGA",
  beaconing: "Botnet Beaconing",
  encrypted_session: "Encrypted Session",
  exfiltration: "Data Exfiltration",
  udp_amplification: "UDP Amplification",
  slowloris: "Slowloris",
};

const humanThreat = (value: string) =>
  SCENARIO_DISPLAY_NAMES[value] ||
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(
    new Date(value),
  );

interface IncidentsViewProps {
  alerts: Alert[];
  selectedAlert: Alert | null;
  onSelectAlert: (alert: Alert) => void;
}

export function IncidentsView({ alerts, selectedAlert, onSelectAlert }: IncidentsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [detectorFilter, setDetectorFilter] = useState("all");

  // Extract unique detectors for the detector dropdown
  const detectors = useMemo(() => {
    const set = new Set<string>();
    alerts.forEach((a) => set.add(a.detector));
    return Array.from(set);
  }, [alerts]);

  const counts = useMemo(() => {
    return alerts.reduce<Record<string, number>>((acc, a) => {
      acc[a.severity] = (acc[a.severity] ?? 0) + 1;
      return acc;
    }, {});
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
      const matchesDetector = detectorFilter === "all" || alert.detector === detectorFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        alert.threat_class.toLowerCase().includes(q) ||
        alert.source_ip.includes(q) ||
        alert.destination_ip.includes(q) ||
        alert.detector.toLowerCase().includes(q) ||
        alert.alert_id.toLowerCase().includes(q);
      return matchesSeverity && matchesDetector && matchesSearch;
    });
  }, [alerts, severityFilter, detectorFilter, searchQuery]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-header-left">
          <span className="view-kicker">ANALYST TRIAGE QUEUE</span>
          <h2 className="view-title">Incidents Workspace</h2>
          <p className="view-subtitle">
            Structured SOC detection alerts · Interactive triage queue · Click any incident to open investigation drawer
          </p>
        </div>
        <div className="view-header-right">
          <div className="status-pill active" style={{ borderColor: "var(--color-caribbean-green)" }}>
            <ShieldCheck size={14} style={{ color: "var(--color-caribbean-green)" }} />
            <span>{alerts.length} TOTAL INCIDENTS LOGGED</span>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS BAR */}
      <div className="kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi-card tone-critical">
          <div className="kpi-top">
            <span className="kpi-eyebrow">Critical Severity</span>
            <AlertTriangle className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{counts.critical ?? 0}</div>
            <div className="kpi-sub">Requires immediate analyst intervention</div>
          </div>
        </div>

        <div className="kpi-card tone-warning">
          <div className="kpi-top">
            <span className="kpi-eyebrow">High Severity</span>
            <ShieldAlert className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{counts.high ?? 0}</div>
            <div className="kpi-sub">Suspicious activity verified</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-eyebrow">Medium / Low Severity</span>
            <Filter className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{(counts.medium ?? 0) + (counts.low ?? 0)}</div>
            <div className="kpi-sub">{counts.medium ?? 0} Medium · {counts.low ?? 0} Low</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-eyebrow">Filter Match</span>
            <ShieldCheck className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{filteredAlerts.length}</div>
            <div className="kpi-sub">Incidents displayed below</div>
          </div>
        </div>
      </div>

      {/* INCIDENT TABLE CARD */}
      <section className="soc-card">
        <div className="soc-card-header">
          <div className="soc-card-title-group">
            <span className="soc-card-kicker">TRIAGE QUEUE</span>
            <h2 className="soc-card-title">Alert Triage Stream</h2>
          </div>
          <div className="status-pill active">
            <span className="status-dot green" />
            <span>{filteredAlerts.length} VISIBLE</span>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="table-filter-bar" style={{ flexWrap: "wrap", gap: "10px" }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: "220px" }}>
            <Search className="search-icon" size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search IP, threat class, or detector name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="soc-select-wrapper" style={{ minWidth: "150px" }}>
            <select
              aria-label="Filter severity"
              className="soc-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          {detectors.length > 0 && (
            <div className="soc-select-wrapper" style={{ minWidth: "160px" }}>
              <select
                aria-label="Filter detector"
                className="soc-select"
                value={detectorFilter}
                onChange={(e) => setDetectorFilter(e.target.value)}
              >
                <option value="all">All Detectors</option>
                {detectors.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* INCIDENTS TABLE */}
        <div className="soc-table-wrapper">
          <table className="soc-table">
            <thead>
              <tr>
                <th>SEVERITY</th>
                <th>THREAT CLASS</th>
                <th>SOURCE TELEMETRY</th>
                <th>DESTINATION TELEMETRY</th>
                <th>CONFIDENCE</th>
                <th>DETECTOR ENGINE</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--color-stone)", padding: "45px 0" }}>
                    No threat alerts match the current search filter or scenario state.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.alert_id}
                    className={selectedAlert?.alert_id === alert.alert_id ? "selected" : ""}
                    onClick={() => onSelectAlert(alert)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <span className={`badge-soc ${alert.severity}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-anti-flash-white)" }}>
                          {humanThreat(alert.threat_class)}
                        </span>
                        <span style={{ fontSize: "10px", fontFamily: "DM Mono", color: "var(--color-stone)" }}>
                          {alert.alert_id.slice(0, 18)}...
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="telemetry-cell">
                        <span className="telemetry-primary">{alert.source_ip}</span>
                        <span className="telemetry-secondary">FLOW: {alert.flow_id.slice(0, 16)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="telemetry-cell">
                        <span className="telemetry-primary">
                          {alert.destination_ip}:{alert.flow_id.split(":").pop()}
                        </span>
                        <span className="telemetry-secondary">PROTO: {alert.protocol}</span>
                      </div>
                    </td>
                    <td>
                      <div className="confidence-bar-wrapper">
                        <div className="threat-progress-track" style={{ flex: 1 }}>
                          <div
                            className="threat-progress-fill"
                            style={{ width: `${Math.round(alert.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="confidence-pct">{Math.round(alert.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="mono-text" style={{ fontSize: "11px", color: "var(--color-mountain-meadow)" }}>
                        {alert.detector}
                      </span>
                    </td>
                    <td>
                      <span className="timestamp" style={{ fontSize: "11px", color: "var(--color-stone)" }}>
                        {formatTime(alert.timestamp)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

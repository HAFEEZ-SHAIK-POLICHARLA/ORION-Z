import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Gauge,
  Percent,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Alert, Metrics } from "../types";

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

interface AnalyticsViewProps {
  metrics: Metrics;
  alerts: Alert[];
  timeline: { time: string; alerts: number }[];
}

export function AnalyticsView({ metrics, alerts, timeline }: AnalyticsViewProps) {
  // Severity Distribution
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    alerts.forEach((a) => {
      counts[a.severity] = (counts[a.severity] ?? 0) + 1;
    });
    return counts;
  }, [alerts]);

  // Confidence Distribution Buckets
  const confidenceBuckets = useMemo(() => {
    const buckets = [
      { range: "90-100%", count: 0 },
      { range: "80-89%", count: 0 },
      { range: "70-79%", count: 0 },
      { range: "60-69%", count: 0 },
      { range: "< 60%", count: 0 },
    ];
    alerts.forEach((a) => {
      const pct = Math.round(a.confidence * 100);
      if (pct >= 90) buckets[0].count++;
      else if (pct >= 80) buckets[1].count++;
      else if (pct >= 70) buckets[2].count++;
      else if (pct >= 60) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [alerts]);

  // Alert Rate (% of flows that generated alert)
  const alertRatePct = useMemo(() => {
    if (!metrics.processed_events || metrics.processed_events === 0) return 0;
    return ((metrics.alerts_generated / metrics.processed_events) * 100).toFixed(2);
  }, [metrics.alerts_generated, metrics.processed_events]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-header-left">
          <span className="view-kicker">SECURITY TELEMETRY</span>
          <h2 className="view-title">Security Analytics</h2>
          <p className="view-subtitle">
            Realtime detection metrics, threat distribution, confidence statistics & performance analysis
          </p>
        </div>
        <div className="view-header-right">
          <div className="status-pill active">
            <span className="status-dot green" />
            <span>ENCLAVE STATS LIVE</span>
          </div>
        </div>
      </div>

      {/* KPI METRICS ROW */}
      <div className="kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-eyebrow">Events Processed</span>
            <Activity className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{metrics.processed_events.toLocaleString()}</div>
            <div className="kpi-sub">{metrics.events_per_second.toLocaleString()} flows/sec throughput</div>
          </div>
        </div>

        <div className="kpi-card tone-critical">
          <div className="kpi-top">
            <span className="kpi-eyebrow">Total Detections</span>
            <AlertTriangle className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{metrics.alerts_generated.toLocaleString()}</div>
            <div className="kpi-sub">{severityCounts.critical} Critical · {severityCounts.high} High</div>
          </div>
        </div>

        <div className="kpi-card tone-warning">
          <div className="kpi-top">
            <span className="kpi-eyebrow">Alert Rate</span>
            <Percent className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{alertRatePct}%</div>
            <div className="kpi-sub">Alerts per flow evaluated</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-eyebrow">Avg Detection Latency</span>
            <Gauge className="kpi-icon" size={18} />
          </div>
          <div className="kpi-body">
            <div className="kpi-value">{metrics.average_alert_latency_ms.toFixed(0)} ms</div>
            <div className="kpi-sub">SLA target: &lt; 2000 ms</div>
          </div>
        </div>
      </div>

      {/* CHARTS GRID 1: TIMELINE & SEVERITY */}
      <div className="analytics-grid" style={{ marginBottom: "20px" }}>
        {/* TIMELINE AREA CHART */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title-group">
              <span className="soc-card-kicker">STREAM DYNAMICS</span>
              <h2 className="soc-card-title">Realtime Detection Velocity</h2>
            </div>
            <span className="mono-text" style={{ fontSize: "11px", color: "var(--color-stone)" }}>
              Window: last 15 points
            </span>
          </div>

          <div className="timeline-chart-wrap" style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="analyticsGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d084" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d084" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#133a30" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#7c8785" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} stroke="#7c8785" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#091a16",
                    border: "1px solid #1a5647",
                    borderRadius: "6px",
                    color: "#f8f8f8",
                    fontSize: "12px",
                    fontFamily: "DM Mono",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="alerts"
                  stroke="#00d084"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#analyticsGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SEVERITY BREAKDOWN */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title-group">
              <span className="soc-card-kicker">RISK PROFILE</span>
              <h2 className="soc-card-title">Severity Breakdown</h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
            {Object.entries(severityCounts).map(([sev, count]) => {
              const total = alerts.length || 1;
              const pct = Math.round((count / total) * 100);
              const color =
                sev === "critical"
                  ? "var(--severity-critical)"
                  : sev === "high"
                  ? "var(--severity-high)"
                  : sev === "medium"
                  ? "var(--severity-medium)"
                  : "var(--severity-low)";

              return (
                <div key={sev} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span className="mono-text" style={{ textTransform: "uppercase", color, fontWeight: 700 }}>
                      {sev}
                    </span>
                    <span className="mono-text" style={{ color: "var(--color-anti-flash-white)" }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="threat-progress-track">
                    <div
                      className="threat-progress-fill"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHARTS GRID 2: THREAT DISTRIBUTION & CONFIDENCE BUCKETS */}
      <div className="analytics-grid">
        {/* THREAT CLASS DISTRIBUTION */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title-group">
              <span className="soc-card-kicker">CLASSIFICATION</span>
              <h2 className="soc-card-title">Threat Class Distribution</h2>
            </div>
          </div>

          <div className="threat-distribution-list">
            {Object.entries(metrics.threat_counts).length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--color-stone)", padding: "30px 0", fontSize: "13px" }}>
                No detections recorded in current replay session.
              </div>
            ) : (
              Object.entries(metrics.threat_counts).map(([threat, count]) => {
                const pct = Math.round((count / (metrics.alerts_generated || 1)) * 100);
                return (
                  <div className="threat-row" key={threat}>
                    <div className="threat-row-top">
                      <span className="threat-name-label">{humanThreat(threat)}</span>
                      <span className="threat-count-val">{count} ({pct}%)</span>
                    </div>
                    <div className="threat-progress-track">
                      <div className="threat-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CONFIDENCE DISTRIBUTION */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title-group">
              <span className="soc-card-kicker">DETECTOR ASSURANCE</span>
              <h2 className="soc-card-title">Alert Confidence Spread</h2>
            </div>
          </div>

          <div style={{ height: "200px", marginTop: "10px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#133a30" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" stroke="#7c8785" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} stroke="#7c8785" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#091a16",
                    border: "1px solid #1a5647",
                    borderRadius: "6px",
                    color: "#f8f8f8",
                    fontSize: "12px",
                    fontFamily: "DM Mono",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-caribbean-green)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

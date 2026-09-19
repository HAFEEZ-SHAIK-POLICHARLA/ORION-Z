import React from "react";
import { Play, CircleStop, FlaskConical, Gauge, Activity } from "lucide-react";
import type { Alert, FlowEvent, Metrics } from "../types";
import { AttackReplayPanel } from "./AttackReplayPanel";
import { AttackExplainer } from "./AttackExplainer";

interface ThreatLabViewProps {
  scenarios: string[];
  selectedScenario: string;
  onSelectScenario: (sc: string) => void;
  speed?: string;
  onChangeSpeed?: (sp: string) => void;
  metrics: Metrics;
  flows: FlowEvent[];
  alerts: Alert[];
  onStart: () => void;
  onStop: () => void;
  onRefresh?: () => void;
}

const HUMAN_SCENARIOS: Record<string, string> = {
  syn_flood: "1. SYN Flood Attack",
  port_scanning: "2. TCP/UDP Port Scanning",
  dns_tunnelling: "3. DNS Data Tunnelling",
  dga: "4. DGA (Domain Generation)",
  beaconing: "5. Botnet C2 Beaconing",
  encrypted_session: "6. Encrypted Session Anomaly",
  exfiltration: "7. High-Volume Exfiltration",
  udp_amplification: "8. UDP Amplification Flood",
  slowloris: "9. Slowloris HTTP Exhaustion",
};

export const ThreatLabView: React.FC<ThreatLabViewProps> = ({
  scenarios,
  selectedScenario,
  onSelectScenario,
  metrics,
  flows,
  alerts,
  onStart,
  onStop,
}) => {
  const isRunning = metrics.status === "running";
  const latestAlert = alerts.length > 0 ? alerts[0] : null;

  return (
    <div className="v2-page-section">
      {/* 1. THREAT LAB HEADER & CONTROL BAR */}
      <div className="v2-lab-control-bar">
        <div className="v2-lab-left">
          <div className="v2-lab-badge">
            <FlaskConical size={14} />
            <span>CONTROLLED SIMULATION / THREAT LAB</span>
          </div>
          <h2 className="v2-lab-title">Attack Replay & Detection Enclave</h2>
          <p className="v2-lab-desc">
            Isolated replay testing environment. Replays historical attack PCAP datasets through the common detection engine.
          </p>
        </div>

        <div className="v2-lab-right">
          {/* Scenario Selector */}
          <div className="v2-select-group">
            <label htmlFor="scenario-select" className="v2-select-label">Scenario</label>
            <select
              id="scenario-select"
              className="v2-select"
              value={selectedScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              disabled={isRunning}
            >
              {scenarios.map((sc) => (
                <option key={sc} value={sc}>
                  {HUMAN_SCENARIOS[sc] || sc.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Start Replay */}
          <button
            className="v2-btn-emerald"
            onClick={onStart}
            disabled={isRunning || !selectedScenario}
          >
            <Play size={15} />
            <span>Start Replay</span>
          </button>

          {/* Stop Replay */}
          <button
            className="v2-btn-danger"
            onClick={onStop}
            disabled={!isRunning}
          >
            <CircleStop size={15} />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* 2. REPLAY METRICS SUMMARY */}
      <div className="v2-grid-4">
        <div className="v2-stat-card">
          <span className="v2-stat-label">Replay Events</span>
          <div className="v2-stat-value">{metrics.processed_events.toLocaleString()}</div>
          <div className="v2-stat-sub">
            <Activity size={12} />
            <span>{metrics.events_per_second} flows/s</span>
          </div>
        </div>

        <div className="v2-stat-card">
          <span className="v2-stat-label">Alerts Generated</span>
          <div className="v2-stat-value">{metrics.alerts_generated.toLocaleString()}</div>
          <div className="v2-stat-sub">
            <span>Detections triggered</span>
          </div>
        </div>

        <div className="v2-stat-card">
          <span className="v2-stat-label">Average Latency</span>
          <div className="v2-stat-value">{metrics.average_alert_latency_ms.toFixed(1)} ms</div>
          <div className="v2-stat-sub">
            <Gauge size={12} />
            <span>Detector processing time</span>
          </div>
        </div>

        <div className="v2-stat-card">
          <span className="v2-stat-label">Simulation Status</span>
          <div className="v2-stat-value" style={{ fontSize: "18px", textTransform: "uppercase" }}>
            {metrics.status}
          </div>
          <div className="v2-stat-sub">
            <span>{isRunning ? `Replaying ${selectedScenario}` : "Lab Idle"}</span>
          </div>
        </div>
      </div>

      {/* 3. ATTACK EXPLAINER */}
      <AttackExplainer
        scenario={selectedScenario}
        status={metrics.status}
        flows={flows}
        latestAlert={latestAlert}
        metrics={metrics}
      />

      {/* 4. ATTACK REPLAY PANEL WITH ALL 9 SCENARIO VISUALIZATIONS */}
      <AttackReplayPanel
        scenario={selectedScenario}
        status={metrics.status}
        flows={flows}
        latestAlert={latestAlert}
        metrics={metrics}
      />
    </div>
  );
};

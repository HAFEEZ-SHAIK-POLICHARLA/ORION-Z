import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Layers,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { Metrics } from "../types";

interface SystemViewProps {
  metrics: Metrics;
  connected: boolean;
  appwriteReady: boolean;
  appwriteConfigured: boolean;
  speed: string;
  selectedScenario: string;
}

export function SystemView({
  metrics,
  connected,
  appwriteReady,
  appwriteConfigured,
  speed,
  selectedScenario,
}: SystemViewProps) {
  const isMlAvailable = Boolean(metrics.model_status?.available);
  const isOllamaAvailable = Boolean(metrics.ollama_status?.available);
  const isAppwriteActive = Boolean(appwriteConfigured && appwriteReady);

  const pipelineSteps = [
    {
      id: "flow",
      name: "PASSIVE FLOW",
      desc: "Metadata ingestion via WS",
      status: connected ? "active" : "offline",
      icon: <Radio size={16} />,
    },
    {
      id: "feature",
      name: "FEATURE EXTRACTION",
      desc: "30s window accumulation",
      status: connected ? "active" : "offline",
      icon: <Layers size={16} />,
    },
    {
      id: "rule",
      name: "RULE EVALUATION",
      desc: "Deterministic threshold engine",
      status: "active",
      icon: <ShieldCheck size={16} />,
    },
    {
      id: "ml",
      name: "ML ENRICHMENT",
      desc: isMlAvailable ? `Model version v${metrics.model_status?.version}` : "Optional ML offline",
      status: isMlAvailable ? "active" : "optional_off",
      icon: <Cpu size={16} />,
    },
    {
      id: "decision",
      name: "FINAL DECISION",
      desc: "Confidence & severity calculation",
      status: "active",
      icon: <Zap size={16} />,
    },
    {
      id: "alert",
      name: "SOC ALERT",
      desc: isAppwriteActive ? "Dispatched + Appwrite sync" : "Dispatched locally",
      status: "active",
      icon: <CheckCircle2 size={16} />,
    },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-header-left">
          <span className="view-kicker">INFRASTRUCTURE & ENGINE MONITOR</span>
          <h2 className="view-title">System Monitor</h2>
          <p className="view-subtitle">
            ORION-Z engine health, microservice connectivity, pipeline state & detection runtime parameters
          </p>
        </div>
        <div className="view-header-right">
          <div className={`status-pill ${connected ? "active" : ""}`}>
            <span className={`status-dot ${connected ? "green" : "amber"}`} />
            <span>{connected ? "ALL SYSTEMS OPERATIONAL" : "BACKEND RECONNECTING"}</span>
          </div>
        </div>
      </div>

      {/* PIPELINE VISUALIZATION */}
      <section className="soc-card" style={{ marginBottom: "20px" }}>
        <div className="soc-card-header">
          <div className="soc-card-title-group">
            <span className="soc-card-kicker">ARCHITECTURE</span>
            <h2 className="soc-card-title">ORION-Z Threat Detection Pipeline</h2>
          </div>
          <span className="mono-text" style={{ fontSize: "11px", color: "var(--color-stone)" }}>
            Passive Non-Intrusive Enclave
          </span>
        </div>

        <div className="pipeline-vis-grid">
          {pipelineSteps.map((step, idx) => {
            const isActive = step.status === "active";
            const isOff = step.status === "offline";

            return (
              <div key={step.id} className="pipeline-step-wrap">
                <div className={`pipeline-step-card ${step.status}`}>
                  <div className="pipeline-step-header">
                    <span className="pipeline-step-icon">{step.icon}</span>
                    <span className="pipeline-step-badge">
                      {isActive ? "ACTIVE" : isOff ? "OFFLINE" : "OPTIONAL OFF"}
                    </span>
                  </div>
                  <div className="pipeline-step-name">{step.name}</div>
                  <div className="pipeline-step-desc">{step.desc}</div>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <div className="pipeline-arrow-wrap">
                    <ArrowRight size={16} className="pipeline-arrow" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* COMPONENT STATUS GRID */}
      <div className="analytics-grid" style={{ marginBottom: "20px" }}>
        {/* SERVICES MONITOR */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title-group">
              <span className="soc-card-kicker">MICROSERVICES</span>
              <h2 className="soc-card-title">Subsystem Health</h2>
            </div>
          </div>

          <div className="system-services-list">
            <div className="system-service-row">
              <div className="system-service-left">
                <Server size={16} className="system-service-icon" />
                <div>
                  <span className="system-service-title">FastAPI Local Engine</span>
                  <span className="system-service-desc">Core detection & REST backend (Port 8000)</span>
                </div>
              </div>
              <span className={`status-pill ${connected ? "active" : ""}`}>
                <span className={`status-dot ${connected ? "green" : "amber"}`} />
                {connected ? "ONLINE" : "DISCONNECTED"}
              </span>
            </div>

            <div className="system-service-row">
              <div className="system-service-left">
                <Radio size={16} className="system-service-icon" />
                <div>
                  <span className="system-service-title">WebSocket Telemetry Stream</span>
                  <span className="system-service-desc">FlowEvent and Alert broadcast channel</span>
                </div>
              </div>
              <span className={`status-pill ${connected ? "active" : ""}`}>
                <span className={`status-dot ${connected ? "green" : "amber"}`} />
                {connected ? "CONNECTED" : "RECONNECTING"}
              </span>
            </div>

            <div className="system-service-row">
              <div className="system-service-left">
                <ShieldCheck size={16} className="system-service-icon" />
                <div>
                  <span className="system-service-title">Deterministic Rule Engine</span>
                  <span className="system-service-desc">9 threat detection profiles loaded</span>
                </div>
              </div>
              <span className="status-pill active">
                <span className="status-dot green" />
                9 DETECTORS OK
              </span>
            </div>

            <div className="system-service-row">
              <div className="system-service-left">
                <Cpu size={16} className="system-service-icon" />
                <div>
                  <span className="system-service-title">Machine Learning Scorer</span>
                  <span className="system-service-desc">
                    {isMlAvailable
                      ? `Model scoring active (v${metrics.model_status?.version || "1.0"})`
                      : "Optional ML model artifact not loaded"}
                  </span>
                </div>
              </div>
              <span className={`status-pill ${isMlAvailable ? "active" : ""}`}>
                <span className={`status-dot ${isMlAvailable ? "green" : "stone"}`} />
                {isMlAvailable ? "ACTIVE" : "OFFLINE"}
              </span>
            </div>

            <div className="system-service-row">
              <div className="system-service-left">
                <Database size={16} className="system-service-icon" />
                <div>
                  <span className="system-service-title">Appwrite Cloud Persistence</span>
                  <span className="system-service-desc">
                    {appwriteConfigured
                      ? `Cloud Sync Configured (${metrics.appwrite_status?.persisted_count ?? 0} persisted)`
                      : "Optional Appwrite credentials not set in .env"}
                  </span>
                </div>
              </div>
              <span className={`status-pill ${isAppwriteActive ? "active" : ""}`}>
                <span className={`status-dot ${isAppwriteActive ? "green" : "stone"}`} />
                {isAppwriteActive ? "SYNC READY" : appwriteConfigured ? "OFFLINE" : "NOT CONFIGURED"}
              </span>
            </div>

            <div className="system-service-row">
              <div className="system-service-left">
                <Sparkles size={16} className="system-service-icon" />
                <div>
                  <span className="system-service-title">Ollama LLM Explanation Engine</span>
                  <span className="system-service-desc">
                    {isOllamaAvailable
                      ? `Local Model: ${metrics.ollama_status?.model || "ollama"}`
                      : "Optional local Ollama daemon offline"}
                  </span>
                </div>
              </div>
              <span className={`status-pill ${isOllamaAvailable ? "active" : ""}`}>
                <span className={`status-dot ${isOllamaAvailable ? "green" : "stone"}`} />
                {isOllamaAvailable ? "READY" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>

        {/* RUNTIME REPLAY STATE */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title-group">
              <span className="soc-card-kicker">RUNTIME PARAMETERS</span>
              <h2 className="soc-card-title">Replay & Engine Metrics</h2>
            </div>
          </div>

          <div className="system-metrics-grid">
            <div className="system-metric-tile">
              <span className="system-tile-label">REPLAY STATE</span>
              <span className="system-tile-value" style={{ color: metrics.running ? "var(--color-caribbean-green)" : "var(--color-anti-flash-white)" }}>
                {metrics.status.toUpperCase()}
              </span>
            </div>

            <div className="system-metric-tile">
              <span className="system-tile-label">ACTIVE SCENARIO</span>
              <span className="system-tile-value">{selectedScenario || "None"}</span>
            </div>

            <div className="system-metric-tile">
              <span className="system-tile-label">REPLAY SPEED multiplier</span>
              <span className="system-tile-value">{speed}x</span>
            </div>

            <div className="system-metric-tile">
              <span className="system-tile-label">FLOWS PROCESSED</span>
              <span className="system-tile-value">{metrics.processed_events.toLocaleString()}</span>
            </div>

            <div className="system-metric-tile">
              <span className="system-tile-label">ALERTS GENERATED</span>
              <span className="system-tile-value">{metrics.alerts_generated.toLocaleString()}</span>
            </div>

            <div className="system-metric-tile">
              <span className="system-tile-label">AVG LATENCY</span>
              <span className="system-tile-value">{metrics.average_alert_latency_ms.toFixed(0)} ms</span>
            </div>

            <div className="system-metric-tile">
              <span className="system-tile-label">MODEL VERSION</span>
              <span className="system-tile-value">{metrics.model_status?.version || "1.0.0"}</span>
            </div>

            <div className="system-metric-tile">
              <span className="system-tile-label">ERRORS ENCOUNTERED</span>
              <span className="system-tile-value" style={{ color: metrics.error_count > 0 ? "var(--severity-critical)" : "var(--color-mountain-meadow)" }}>
                {metrics.error_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

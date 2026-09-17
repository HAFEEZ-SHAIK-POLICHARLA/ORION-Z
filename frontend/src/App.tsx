import { useCallback, useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import {
  getAlerts,
  getMetrics,
  getRealtimeStatus,
  getScenarios,
  socketUrl,
  startRealtime,
  startReplay,
  stopRealtime,
  stopReplay,
} from "./api";
import { appwriteConfigured, listStoredAlerts, subscribeAlerts } from "./appwrite";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { LandingView } from "./components/LandingView";
import { DashboardView } from "./components/DashboardView";
import { LabResultsView } from "./components/LabResultsView";
import { RealTimeView } from "./components/RealTimeView";
import { ThreatLabView } from "./components/ThreatLabView";
import { SystemView } from "./components/SystemView";
import { ThreatsView } from "./components/ThreatsView";
import type { Alert, FlowEvent, Metrics, RealtimeMetrics, SocketMessage } from "./types";


const initialMetrics: Metrics = {
  processed_events: 0,
  alerts_generated: 0,
  events_per_second: 0,
  average_alert_latency_ms: 0,
  scenario: null,
  status: "idle",
  running: false,
  started_at: null,
  finished_at: null,
  threat_counts: {},
  error_count: 0,
};

const DEFAULT_SCENARIOS = [
  "syn_flood",
  "port_scanning",
  "dns_tunnelling",
  "dga",
  "beaconing",
  "encrypted_session",
  "exfiltration",
  "udp_amplification",
  "slowloris",
];

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
    new Date(value)
  );

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);

  const [scenarios, setScenarios] = useState<string[]>(DEFAULT_SCENARIOS);
  const [selectedScenario, setSelectedScenario] = useState<string>("syn_flood");
  const [speed, setSpeed] = useState("12");

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [connected, setConnected] = useState(false);
  const [appwriteReady, setAppwriteReady] = useState(appwriteConfigured);
  const [appwriteError, setAppwriteError] = useState("");
  const [actionError, setActionError] = useState("");
  // Tracks Category-B sensor-prereq failures separately from app-level errors.
  // This is shown inside RealTimeView, never as a top-level global banner.
  const [sensorError, setSensorError] = useState("");

  const [flows, setFlows] = useState<FlowEvent[]>([]);
  // Unified timeline for ALL alerts (used by Lab Results — simulation domain)
  const [timeline, setTimeline] = useState<{ time: string; alerts: number }[]>([]);
  // Separate timeline for LIVE-only alerts (used by Dashboard — operations domain)
  const [liveTimeline, setLiveTimeline] = useState<{ time: string; alerts: number }[]>([]);


  const prependAlert = useCallback((alert: Alert) => {
    setAlerts((current) => [alert, ...current.filter((item) => item.alert_id !== alert.alert_id)].slice(0, 100));
    // All alerts feed the simulation timeline (Lab Results domain)
    setTimeline((current) => [...current.slice(-14), { time: formatTime(alert.timestamp), alerts: 1 }]);
    // Only strictly-live alerts feed the live operational timeline (Dashboard domain)
    if (alert.source_mode === "live") {
      setLiveTimeline((current) => [...current.slice(-14), { time: formatTime(alert.timestamp), alerts: 1 }]);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      const [scenarioData, metricData, alertData, liveData] = await Promise.all([
        getScenarios().catch(() => DEFAULT_SCENARIOS),
        getMetrics().catch(() => initialMetrics),
        getAlerts().catch(() => []),
        getRealtimeStatus().catch(() => null),
      ]);
      if (scenarioData && scenarioData.length > 0) {
        setScenarios(scenarioData);
        setSelectedScenario((current) => (current && scenarioData.includes(current) ? current : scenarioData[0]));
      }
      setMetrics(metricData);
      setRealtimeMetrics(liveData);
      setAlerts(alertData);
      setTimeline(alertData.slice(0, 14).reverse().map((alert) => ({ time: formatTime(alert.timestamp), alerts: 1 })));
      const liveOnly = alertData.filter((a) => a.source_mode === "live");
      setLiveTimeline(liveOnly.slice(0, 14).reverse().map((alert) => ({ time: formatTime(alert.timestamp), alerts: 1 })));

      if (appwriteConfigured) {
        try {
          const stored = await listStoredAlerts(100);
          if (stored.length > 0) {
            setAlerts(stored);
            setTimeline(stored.slice(0, 14).reverse().map((alert) => ({ time: formatTime(alert.timestamp), alerts: 1 })));
            const storedLive = stored.filter((a) => a.source_mode === "live");
            setLiveTimeline(storedLive.slice(0, 14).reverse().map((alert) => ({ time: formatTime(alert.timestamp), alerts: 1 })));
          }
        } catch (error) {
          setAppwriteError(error instanceof Error ? error.message : "Unable to list Appwrite alerts");
        }
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to load detection backend");
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
    let isMounted = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!isMounted) return;
      ws = new WebSocket(socketUrl());
      ws.onopen = () => {
        if (isMounted) setConnected(true);
      };
      ws.onclose = () => {
        if (isMounted) {
          setConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        }
      };
      ws.onerror = () => {
        if (isMounted) setConnected(false);
      };
      ws.onmessage = (message) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(message.data) as SocketMessage;
          if (payload.type === "flow") {
            setFlows((current) => [payload.flow, ...current].slice(0, 100));
          } else if (payload.type === "metrics") {
            setMetrics(payload.metrics);
          } else if (payload.type === "live_status") {
            setRealtimeMetrics(payload.metrics);
          } else if (payload.type === "explained") {
            setAlerts((current) =>
              current.map((alert) =>
                alert.alert_id === payload.alert_id ? { ...alert, explanation: payload.explanation } : alert
              )
            );
          } else if (payload.type === "alert") {
            prependAlert(payload.alert);
          }
        } catch {
          // ignore JSON parse error
        }
      };
    };

    connect();

    // Background polling fallback every 2 seconds
    const pollInterval = setInterval(() => {
      if (isMounted) {
        void getMetrics().then((m) => isMounted && setMetrics(m)).catch(() => { });
        void getRealtimeStatus().then((r) => isMounted && setRealtimeMetrics(r)).catch(() => { });
      }
    }, 2000);

    const appwriteRealtime = subscribeAlerts(
      (alert) => prependAlert(alert),
      (message) => setAppwriteError(message)
    );
    if (appwriteConfigured) {
      setAppwriteReady(Boolean(appwriteRealtime));
    }

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
      ws?.close();
      appwriteRealtime?.unsubscribe();
    };
  }, [loadInitialData, prependAlert]);

  // Sync simulation alerts upon simulation completion or stop to guarantee complete state
  useEffect(() => {
    if (metrics.status === "completed" || metrics.status === "stopped") {
      getAlerts()
        .then((latestAlerts) => {
          if (latestAlerts && latestAlerts.length > 0) {
            setAlerts((current) => {
              const existingIds = new Set(current.map((a) => a.alert_id));
              const newItems = latestAlerts.filter((a) => !existingIds.has(a.alert_id));
              if (newItems.length === 0) return current;
              return [...newItems, ...current].slice(0, 100);
            });
          }
        })
        .catch(() => {});
    }
  }, [metrics.status]);

  // Real-Time Handlers
  const handleStartRealtime = async () => {
    setActionError("");
    setSensorError("");
    try {
      const status = await startRealtime();
      setRealtimeMetrics(status);
      // Category B: sensor prerequisite failure — not a backend error, never shown as a global banner.
      if (status.status === "PASSIVE_TAP_UNAVAILABLE") {
        setSensorError(
          status.last_error ||
            "Live sensor prerequisites not met. Install Npcap and run the backend with Administrator privileges."
        );
      }
    } catch (error) {
      // Category A: genuine backend/API failure
      setActionError(error instanceof Error ? error.message : "Unable to reach the real-time detection backend.");
    }
  };

  const handleStopRealtime = async () => {
    setActionError("");
    setSensorError("");
    try {
      const status = await stopRealtime();
      setRealtimeMetrics(status);
    } catch (error) {
      // Category A: genuine backend error
      setActionError(error instanceof Error ? error.message : "Unable to stop real-time engine.");
    }
  };

  // Single-flight guard: prevents rapid double-clicks from issuing duplicate POST /api/replay/start
  // requests during the async window before the backend "running" status propagates back.
  const replayStartInFlight = useRef(false);

  // Threat Lab Handlers
  const handleStartReplay = async () => {
    if (!selectedScenario) return;
    // Guard: if a start is already in progress, ignore this invocation entirely.
    if (replayStartInFlight.current) return;
    replayStartInFlight.current = true;
    setActionError("");
    // Clear simulation data only — do not touch liveTimeline or live state
    setAlerts((current) => current.filter((a) => a.source_mode === "live"));
    setFlows([]);
    setTimeline([]);
    setSelectedAlert(null);
    try {
      await startReplay(selectedScenario, Number(speed));
      const latestMetrics = await getMetrics().catch(() => null);
      if (latestMetrics) setMetrics(latestMetrics);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to start simulation replay");
    } finally {
      replayStartInFlight.current = false;
    }
  };

  const handleStopReplay = async () => {
    try {
      await stopReplay();
      const latestMetrics = await getMetrics().catch(() => null);
      if (latestMetrics) setMetrics(latestMetrics);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to stop simulation replay");
    }
  };


  const handleSelectScenario = (sc: string) => {
    setSelectedScenario(sc);
    setAlerts((current) => current.filter((a) => a.source_mode === "live"));
    setFlows([]);
    setTimeline([]);
    setSelectedAlert(null);
  };

  return (
    <div className="v2-app-shell">
      {/* PERSISTENT SIDEBAR FOR ALL NON-LANDING ROUTES */}
      {!isLanding && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      <div className="v2-main-wrapper">
        {/* PERSISTENT HEADER FOR ALL NON-LANDING ROUTES */}
        {!isLanding && (
          <Header
            connected={connected}
            metrics={metrics}
            realtimeMetrics={realtimeMetrics}
            appwriteConfigured={appwriteConfigured}
            appwriteReady={appwriteReady}
          />
        )}

        {/* WORKSPACE CANVAS */}
        <main className={isLanding ? "v2-landing-canvas" : "v2-workspace-canvas"}>
          {/* Global error banner: Category A (backend/infra) errors only.
               Suppressed on the realtime route — RealTimeView manages its own state display. */}
          {actionError && location.pathname !== "/realtime" && (
            <div className="v2-banner-diagnostic" style={{ marginBottom: "16px" }}>
              <span className="text-red"><strong>BACKEND ERROR:</strong> {actionError}</span>
            </div>
          )}
          {appwriteError && (
            <div className="v2-banner-diagnostic" style={{ marginBottom: "16px" }}>
              <span className="text-amber"><strong>APPWRITE SYNC:</strong> {appwriteError}</span>
            </div>
          )}

          <Routes>
            <Route path="/" element={<LandingView />} />
            <Route
              path="/threatlab"
              element={
                <ThreatLabView
                  scenarios={scenarios}
                  selectedScenario={selectedScenario}
                  onSelectScenario={handleSelectScenario}
                  speed={speed}
                  onChangeSpeed={setSpeed}
                  metrics={metrics}
                  flows={flows}
                  alerts={alerts.filter((a) => a.source_mode === "simulation")}
                  onStart={handleStartReplay}
                  onStop={handleStopReplay}
                  onRefresh={() => void loadInitialData()}
                />
              }
            />
            <Route
              path="/threats"
              element={<ThreatsView alerts={alerts} />}
            />
            {/* EXPLORE: Lab Results — strictly simulation alerts only */}
            <Route
              path="/lab-results"
              element={
                <LabResultsView
                  metrics={metrics}
                  simAlerts={alerts.filter((a) => a.source_mode === "simulation")}
                  timeline={timeline}
                  selectedAlert={selectedAlert}
                  onSelectAlert={setSelectedAlert}
                />
              }
            />
            {/* OPERATIONS: Dashboard — strictly live alerts only */}
            <Route
              path="/dashboard"
              element={
                <DashboardView
                  realtimeMetrics={realtimeMetrics}
                  liveAlerts={alerts.filter((a) => a.source_mode === "live")}
                  liveTimeline={liveTimeline}
                  selectedAlert={selectedAlert}
                  onSelectAlert={setSelectedAlert}
                />
              }
            />
            <Route
              path="/realtime"
              element={
                <RealTimeView
                  realtimeMetrics={realtimeMetrics}
                  alerts={alerts}
                  flows={flows}
                  onStart={handleStartRealtime}
                  onStop={handleStopRealtime}
                  onRefresh={() => void loadInitialData()}
                  backendError={actionError}
                  sensorError={sensorError}
                />
              }
            />
            <Route
              path="/system-health"
              element={
                <SystemView
                  metrics={metrics}
                  connected={connected}
                  appwriteReady={appwriteReady}
                  appwriteConfigured={appwriteConfigured}
                  speed={speed}
                  selectedScenario={selectedScenario}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>


      {/* ANALYST INVESTIGATION DRAWER */}
      {selectedAlert && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedAlert(null)} />
          <aside className="drawer-panel-soc">
            <div className="drawer-header-soc">
              <div className="drawer-title-group">
                <span className="drawer-kicker">ANALYST INVESTIGATION</span>
                <h2 className="drawer-title">{humanThreat(selectedAlert.threat_class)}</h2>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setSelectedAlert(null)}
                aria-label="Close investigation drawer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-content-soc">
              <div className="investigation-card">
                <span className="investigation-card-title">INCIDENT SUMMARY</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={`badge-soc ${selectedAlert.severity}`}>
                    {selectedAlert.severity} SEVERITY
                  </span>
                  <span style={{ fontFamily: "DM Mono", fontSize: "14px", color: "#047857", fontWeight: 700 }}>
                    {Math.round(selectedAlert.confidence * 100)}% Confidence
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "DM Mono" }}>
                  Detector: {selectedAlert.detector} (v{selectedAlert.model_version})
                </div>
              </div>

              <div className="investigation-card">
                <span className="investigation-card-title">NETWORK TELEMETRY</span>
                <div className="network-grid-soc">
                  <div className="network-grid-item">
                    <span className="network-grid-label">Source IP</span>
                    <span className="network-grid-value">{selectedAlert.source_ip}</span>
                  </div>
                  <div className="network-grid-item">
                    <span className="network-grid-label">Destination IP</span>
                    <span className="network-grid-value">{selectedAlert.destination_ip}</span>
                  </div>
                  <div className="network-grid-item">
                    <span className="network-grid-label">Protocol</span>
                    <span className="network-grid-value">{selectedAlert.protocol}</span>
                  </div>
                  <div className="network-grid-item">
                    <span className="network-grid-label">Window Duration</span>
                    <span className="network-grid-value">{selectedAlert.window_seconds}s</span>
                  </div>
                  <div className="network-grid-item" style={{ gridColumn: "span 2" }}>
                    <span className="network-grid-label">Flow Identifier</span>
                    <span className="network-grid-value">{selectedAlert.flow_id}</span>
                  </div>
                </div>
              </div>

              <div className="investigation-card">
                <span className="investigation-card-title">DETECTION EVIDENCE</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedAlert.evidence.map((ev) => (
                    <div className="evidence-row-soc" key={ev.feature}>
                      <div className="evidence-row-left">
                        <span className="evidence-feature-name">{ev.feature.replaceAll("_", " ")}</span>
                        <span className="evidence-reason">{ev.reason}</span>
                      </div>
                      <span className="evidence-val">{String(ev.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="explanation-card-soc">
                <span className="investigation-card-title" style={{ color: "#047857" }}>
                  ANALYST EXPLANATION
                </span>
                {selectedAlert.explanation ? (
                  <p>{selectedAlert.explanation}</p>
                ) : metrics.ollama_status?.available ? (
                  <p style={{ color: "#047857", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={14} /> Generating local LLM explanation...
                  </p>
                ) : (
                  <p>
                    Deterministic evidence is available above. Local Ollama LLM integration is currently inactive.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

export default App;

import React, { useState } from "react";
import {
  Play,
  CircleStop,
  Activity,
  Zap,
  RefreshCw,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Wifi,
  WifiOff,
  ArrowDown,
  Lock,
  Cpu,
  Check,
} from "lucide-react";
import type { Alert, FlowEvent, ReadinessChecks, RealtimeMetrics } from "../types";
import { getRealtimeReadiness, getRealtimeStatus } from "../api";
import { AttackExplainer } from "./AttackExplainer";
import { RealTimeDetectionVisualization } from "./attack-graphics/RealTimeDetectionVisualization";

interface RealTimeViewProps {
  realtimeMetrics: RealtimeMetrics | null;
  alerts: Alert[];
  flows: FlowEvent[];
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
  /** Category A: genuine backend/API failure. Surfaced inline. */
  backendError?: string;
  /** Category B: sensor prerequisite failure (Npcap, admin). Never an app error. */
  sensorError?: string;
}

type SensorReadinessState =
  | "RUNNING"             // actively capturing live traffic
  | "SENSOR_NOT_ATTACHED" // PASSIVE_TAP_UNAVAILABLE (Npcap / permission issue)
  | "STANDBY"             // READY FOR CONNECTION — initial clean state
  | "BACKEND_ERROR";     // genuine backend failure

function deriveSensorState(
  metrics: RealtimeMetrics | null,
  backendError: string
): SensorReadinessState {
  if (backendError) return "BACKEND_ERROR";
  if (!metrics) return "STANDBY";
  if (metrics.running && metrics.status === "RUNNING_LIVE") return "RUNNING";
  if (metrics.status === "PASSIVE_TAP_UNAVAILABLE") return "SENSOR_NOT_ATTACHED";
  if (metrics.status === "ERROR") return "BACKEND_ERROR";
  return "STANDBY";
}

interface StepDetailState {
  status: "NOT_CHECKED" | "CHECKING" | "READY" | "NOT_READY";
  message?: string;
}

export const RealTimeView: React.FC<RealTimeViewProps> = ({
  realtimeMetrics,
  alerts,
  flows,
  onStart,
  onStop,
  onRefresh,
  backendError = "",
  sensorError = "",
}) => {
  const [readiness, setReadiness] = useState<ReadinessChecks | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [startPending, setStartPending] = useState(false);

  // CRITICAL RULE: hasChecked is initially false and NEVER set to true by background polling or mount effects.
  // It flips to true ONLY when the user explicitly clicks "Start Live Detection" or "Check Sensor".
  const [hasChecked, setHasChecked] = useState(false);
  const [userExplicitSetupView, setUserExplicitSetupView] = useState(false);

  // Step-specific independent status states (Steps 1 to 5)
  const [stepStates, setStepStates] = useState<Record<number, StepDetailState>>({
    1: { status: "NOT_CHECKED" },
    2: { status: "NOT_CHECKED" },
    3: { status: "NOT_CHECKED" },
    4: { status: "NOT_CHECKED" },
    5: { status: "NOT_CHECKED" },
  });

  const sensorState = deriveSensorState(realtimeMetrics, backendError);
  const isRunning = sensorState === "RUNNING";
  const isSensorNotAttached = sensorState === "SENSOR_NOT_ATTACHED";
  const isBackendError = sensorState === "BACKEND_ERROR";

  // systemState (SAFE/UNSAFE) is strictly guarded: only shown when actively running
  const systemState = isRunning ? (realtimeMetrics?.system_state ?? "SAFE") : null;
  const latestAlert = alerts.length > 0 ? alerts[0] : null;

  // Raw diagnostic text for technical transparency drawer
  const rawDiagnostic =
    readiness?.raw_error ||
    realtimeMetrics?.last_error ||
    sensorError ||
    null;

  const fetchReadinessQuiet = async () => {
    try {
      const data = await getRealtimeReadiness();
      setReadiness(data);
      return data;
    } catch {
      return null;
    }
  };

  // User Action 1: Overall Check Sensor button
  const handleRefreshAll = async () => {
    setLoadingReadiness(true);
    setHasChecked(true);
    onRefresh();
    try {
      const data = await fetchReadinessQuiet();
      if (data) {
        setStepStates({
          1: {
            status: data.npcap_driver.installed ? "READY" : "NOT_READY",
            message: data.npcap_driver.installed
              ? "Npcap packet-capture capability detected on this host."
              : "Npcap was not detected on this computer. Install Npcap with WinPcap API compatibility.",
          },
          2: {
            status: data.admin_privileges.granted ? "READY" : "NOT_READY",
            message: data.admin_privileges.granted
              ? "Required Administrator socket permissions are available to the host sensor."
              : "Required Administrator access is not available to the local ORION-Z sensor process.",
          },
          3: {
            status: realtimeMetrics?.running ? "READY" : "NOT_READY",
            message: realtimeMetrics?.running
              ? "ORION-Z Live Sensor process is running."
              : "ORION-Z Live Sensor is not connected.",
          },
          4: {
            status: data.network_interface?.name ? "READY" : "NOT_READY",
            message: data.network_interface?.name
              ? `Capture interface detected: ${data.network_interface.name}`
              : "No usable network capture interface was detected on this host.",
          },
          5: { status: "NOT_CHECKED" },
        });
      }
    } finally {
      setLoadingReadiness(false);
    }
  };

  // User Action 2: Start Live Detection main button
  const handleStart = async () => {
    setStartPending(true);
    setHasChecked(true);
    try {
      await onStart();
      await handleRefreshAll();
    } finally {
      setStartPending(false);
    }
  };

  // Step 1 Check Button
  const checkStep1 = async () => {
    setStepStates((prev) => ({ ...prev, 1: { status: "CHECKING" } }));
    const data = await fetchReadinessQuiet();
    if (data?.npcap_driver.installed) {
      setStepStates((prev) => ({
        ...prev,
        1: {
          status: "READY",
          message: "Npcap packet-capture capability detected on this computer.",
        },
      }));
    } else {
      setStepStates((prev) => ({
        ...prev,
        1: {
          status: "NOT_READY",
          message:
            "Npcap was not detected on this computer. Download and install Npcap with WinPcap API-compatible Mode enabled, then select Check Npcap again.",
        },
      }));
    }
  };

  // Step 2 Check Button
  const checkStep2 = async () => {
    setStepStates((prev) => ({ ...prev, 2: { status: "CHECKING" } }));
    const data = await fetchReadinessQuiet();
    if (data?.admin_privileges.granted) {
      setStepStates((prev) => ({
        ...prev,
        2: {
          status: "READY",
          message: "Required Administrator socket permissions are available to the host sensor.",
        },
      }));
    } else {
      setStepStates((prev) => ({
        ...prev,
        2: {
          status: "NOT_READY",
          message:
            "Required Administrator access is not available to the local ORION-Z sensor process. Start the Python backend from an elevated Administrator Command Prompt or PowerShell window.",
        },
      }));
    }
  };

  // Step 3 Check Button
  const checkStep3 = async () => {
    setStepStates((prev) => ({ ...prev, 3: { status: "CHECKING" } }));
    try {
      const status = await getRealtimeStatus();
      if (status.running && status.status === "RUNNING_LIVE") {
        setStepStates((prev) => ({
          ...prev,
          3: {
            status: "READY",
            message: "ORION-Z Live Sensor process is running and actively capturing telemetry.",
          },
        }));
      } else {
        setStepStates((prev) => ({
          ...prev,
          3: {
            status: "NOT_READY",
            message:
              "ORION-Z Live Sensor is not connected. Start the local backend process and click Check Connection.",
          },
        }));
      }
    } catch {
      setStepStates((prev) => ({
        ...prev,
        3: {
          status: "NOT_READY",
          message: "ORION-Z Live Sensor endpoint is offline.",
        },
      }));
    }
  };

  // Step 4 Check Button
  const checkStep4 = async () => {
    setStepStates((prev) => ({ ...prev, 4: { status: "CHECKING" } }));
    const data = await fetchReadinessQuiet();
    if (data?.network_interface?.name) {
      setStepStates((prev) => ({
        ...prev,
        4: {
          status: "READY",
          message: `Capture interface detected: ${data.network_interface.name}`,
        },
      }));
    } else {
      setStepStates((prev) => ({
        ...prev,
        4: {
          status: "NOT_READY",
          message: "No usable network capture interface was detected on this host.",
        },
      }));
    }
  };

  // Step 5 Start Live Detection trigger button
  const handleStep5Start = async () => {
    setStepStates((prev) => ({ ...prev, 5: { status: "CHECKING" } }));
    setHasChecked(true);

    const data = await fetchReadinessQuiet();
    const npcapOk = data?.npcap_driver.installed ?? false;
    const adminOk = data?.admin_privileges.granted ?? false;
    const interfaceOk = Boolean(data?.network_interface?.name);

    if (!npcapOk || !adminOk || !interfaceOk) {
      const missing: string[] = [];
      if (!npcapOk) missing.push("Npcap Packet Capture Driver");
      if (!adminOk) missing.push("Administrator Socket Privileges");
      if (!interfaceOk) missing.push("Usable Network Interface");

      setStepStates((prev) => ({
        ...prev,
        5: {
          status: "NOT_READY",
          message: `Complete the required sensor prerequisites above before starting live network monitoring. Missing: ${missing.join(
            ", "
          )}.`,
        },
      }));
      return;
    }

    try {
      await onStart();
      setStepStates((prev) => ({
        ...prev,
        5: {
          status: "READY",
          message: "Live network capture started successfully!",
        },
      }));
    } catch (err) {
      setStepStates((prev) => ({
        ...prev,
        5: {
          status: "NOT_READY",
          message: err instanceof Error ? err.message : "Failed to start live detection engine.",
        },
      }));
    }
  };

  // Setup instructions are visible ONLY after explicit user action AND when sensor is not running
  const showSetupGuide =
    !isRunning && (userExplicitSetupView || (hasChecked && (isSensorNotAttached || sensorError !== "")));

  // Top card style class
  const topCardClass = isRunning
    ? systemState === "UNSAFE"
      ? "unsafe"
      : "safe"
    : isSensorNotAttached && hasChecked
    ? "readiness"
    : isBackendError
    ? "backend-error"
    : "readiness";

  return (
    <div className="v2-page-section">
      {/* ═══ 1. TOP SENSOR STATE HEADER ═════════════════════════════════════ */}
      <div className={`v2-realtime-top-card ${topCardClass}`}>
        <div className="v2-realtime-visual-left">
          <div className={`v2-state-indicator-badge ${topCardClass}`}>
            <span className="v2-indicator-dot" />
            <span>
              {isRunning
                ? `SYSTEM STATE: ${systemState}`
                : isSensorNotAttached && hasChecked
                ? "SENSOR NOT READY — SETUP REQUIRED"
                : isBackendError
                ? "BACKEND UNAVAILABLE"
                : "READY FOR SENSOR CONNECTION"}
            </span>
          </div>

          <h2 className="v2-realtime-title">
            {isRunning
              ? systemState === "UNSAFE"
                ? "Active Threat Detected on Live Network Tap"
                : "Passive Network Tap Active — Zero Threats Observed"
              : isSensorNotAttached && hasChecked
              ? "Live Sensor Prerequisites Not Met"
              : isBackendError
              ? "Detection Backend Unreachable"
              : "Live Promiscuous Network Sensor & Readiness"}
          </h2>

          <p className="v2-realtime-desc">
            {isRunning
              ? `Engine active on ${realtimeMetrics?.interface_name || "network tap"}. Passively observing flow windows without inline latency.`
              : isSensorNotAttached && hasChecked
              ? "ORION-Z successfully started its readiness check, but this computer cannot currently provide the passive network telemetry required for live detection."
              : isBackendError
              ? "The ORION-Z backend API is not responding. Ensure the detection server is running on port 8000."
              : "The ORION-Z detection engine is ready to process live network telemetry when a passive sensor is connected."}
          </p>
        </div>

        {/* Controls */}
        <div className="v2-realtime-controls">
          <button
            className="v2-btn-emerald"
            onClick={handleStart}
            disabled={isRunning || startPending || isBackendError}
            title={
              isBackendError
                ? "Backend unavailable — cannot start sensor"
                : "Start Live Detection & perform prerequisite check"
            }
          >
            {startPending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            <span>{startPending ? "Checking..." : "Start Live Detection"}</span>
          </button>

          <button
            className="v2-btn-danger"
            onClick={onStop}
            disabled={!isRunning}
            title="Stop live passive sensor"
          >
            <CircleStop size={16} />
            <span>Stop Engine</span>
          </button>

          <button
            className="v2-btn-secondary"
            onClick={handleRefreshAll}
            disabled={loadingReadiness}
            title="Perform sensor readiness check"
          >
            <RefreshCw size={15} className={loadingReadiness ? "animate-spin" : ""} />
            <span>Check Sensor</span>
          </button>
        </div>
      </div>

      {/* ═══ 2. BACKEND ERROR INLINE NOTICE (Category A only) ══════════════ */}
      {isBackendError && (
        <div className="v2-banner-diagnostic" style={{ marginBottom: "16px" }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            <strong>BACKEND UNAVAILABLE:</strong>{" "}
            {backendError || "ORION-Z detection API is not responding. Start the backend server and refresh."}
          </span>
        </div>
      )}

      {/* ═══ 3. SENSOR STATUS SUMMARY GRID ══════════════════════════════════ */}
      {!isRunning && (
        <div className="v2-section-frame">
          <div className="v2-frame-header">
            <div className="v2-frame-title-wrap">
              <span className="v2-frame-kicker">SENSOR STATUS SUMMARY</span>
              <h3 className="v2-frame-title">Host Dependency & Permission Verification</h3>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="v2-btn-secondary"
                onClick={() => setUserExplicitSetupView(!userExplicitSetupView)}
                style={{ fontSize: "11px", gap: "4px" }}
              >
                <HelpCircle size={13} />
                <span>{userExplicitSetupView ? "Hide Setup Guide" : "View Sensor Requirements"}</span>
              </button>
              <button
                className="v2-btn-secondary"
                onClick={handleRefreshAll}
                disabled={loadingReadiness}
                style={{ fontSize: "11px", gap: "4px" }}
              >
                <RefreshCw size={13} className={loadingReadiness ? "animate-spin" : ""} />
                <span>Run Readiness Check</span>
              </button>
            </div>
          </div>

          <div className="v2-grid-4" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {/* ITEM 1: Operating System */}
            <div className="v2-stat-card">
              <div className="v2-stat-top">
                <span className="v2-stat-label">Operating System</span>
                <CheckCircle2 size={16} className="text-emerald" />
              </div>
              <div className="v2-stat-value" style={{ fontSize: "16px" }}>
                {readiness?.os || "Windows"}
              </div>
              <div className="v2-stat-sub">
                <span>Compatible host OS</span>
              </div>
            </div>

            {/* ITEM 2: Npcap Driver */}
            <div className="v2-stat-card">
              <div className="v2-stat-top">
                <span className="v2-stat-label">Npcap Driver</span>
                {loadingReadiness ? (
                  <RefreshCw size={14} className="animate-spin text-amber" />
                ) : !hasChecked ? (
                  <HelpCircle size={16} style={{ color: "#94a3b8" }} />
                ) : readiness?.npcap_driver.installed ? (
                  <CheckCircle2 size={16} className="text-emerald" />
                ) : (
                  <XCircle size={16} className="text-amber" />
                )}
              </div>
              <div className="v2-stat-value" style={{ fontSize: "16px" }}>
                {loadingReadiness
                  ? "CHECKING..."
                  : !hasChecked
                  ? "NOT CHECKED"
                  : readiness?.npcap_driver.installed
                  ? "DETECTED"
                  : "REQUIRED / NOT READY"}
              </div>
              <div className="v2-stat-sub">
                <span>
                  {!hasChecked
                    ? "Click Start to verify"
                    : readiness?.npcap_driver.detail || "Kernel-level packet driver"}
                </span>
              </div>
            </div>

            {/* ITEM 3: Permissions */}
            <div className="v2-stat-card">
              <div className="v2-stat-top">
                <span className="v2-stat-label">Permissions</span>
                {loadingReadiness ? (
                  <RefreshCw size={14} className="animate-spin text-amber" />
                ) : !hasChecked ? (
                  <HelpCircle size={16} style={{ color: "#94a3b8" }} />
                ) : readiness?.admin_privileges.granted ? (
                  <CheckCircle2 size={16} className="text-emerald" />
                ) : (
                  <XCircle size={16} className="text-amber" />
                )}
              </div>
              <div className="v2-stat-value" style={{ fontSize: "16px" }}>
                {loadingReadiness
                  ? "CHECKING..."
                  : !hasChecked
                  ? "NOT CHECKED"
                  : readiness?.admin_privileges.granted
                  ? "GRANTED"
                  : "REQUIRED / NOT READY"}
              </div>
              <div className="v2-stat-sub">
                <span>
                  {!hasChecked
                    ? "Elevated socket access"
                    : readiness?.admin_privileges.detail || "Elevated permissions required"}
                </span>
              </div>
            </div>

            {/* ITEM 4: Live Sensor */}
            <div className="v2-stat-card">
              <div className="v2-stat-top">
                <span className="v2-stat-label">Live Sensor</span>
                {isRunning ? (
                  <CheckCircle2 size={16} className="text-emerald" />
                ) : (
                  <WifiOff size={16} style={{ color: "#94a3b8" }} />
                )}
              </div>
              <div className="v2-stat-value" style={{ fontSize: "16px" }}>
                {isRunning ? "CONNECTED" : "NOT CONNECTED"}
              </div>
              <div className="v2-stat-sub">
                <span>{isRunning ? "Stream active" : "Standby mode"}</span>
              </div>
            </div>

            {/* ITEM 5: Detection Engine */}
            <div className="v2-stat-card">
              <div className="v2-stat-top">
                <span className="v2-stat-label">Detection Engine</span>
                {isBackendError ? (
                  <XCircle size={16} className="text-red" />
                ) : (
                  <CheckCircle2 size={16} className="text-emerald" />
                )}
              </div>
              <div className="v2-stat-value" style={{ fontSize: "16px" }}>
                {isBackendError ? "OFFLINE" : "READY"}
              </div>
              <div className="v2-stat-sub">
                <span>{isBackendError ? "Backend unreachable" : "9 detectors loaded"}</span>
              </div>
            </div>
          </div>

          {!hasChecked && !userExplicitSetupView && (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                <strong>Note:</strong> Start Live Detection to check this computer&apos;s live-capture prerequisites.
              </span>
              <button
                className="v2-btn-emerald"
                onClick={handleStart}
                style={{ fontSize: "12px", padding: "6px 14px" }}
              >
                <Play size={13} />
                <span>Start Live Detection</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ 4. VERTICAL TOP-TO-BOTTOM SETUP GUIDE (Shown ONLY after explicit check/start) ═══ */}
      {showSetupGuide && (
        <div className="v2-section-frame">
          <div className="v2-frame-header">
            <div className="v2-frame-title-wrap">
              <span className="v2-frame-kicker" style={{ color: "#d97706" }}>
                ACTION REQUIRED
              </span>
              <h3 className="v2-frame-title">Live Sensor Setup Guide</h3>
            </div>
            <button
              className="v2-btn-emerald"
              onClick={handleRefreshAll}
              disabled={loadingReadiness}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              <RefreshCw size={13} className={loadingReadiness ? "animate-spin" : ""} />
              <span>Check All Prerequisites</span>
            </button>
          </div>

          <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.5" }}>
            ORION-Z successfully executed its readiness check, but this computer cannot currently provide the
            passive network telemetry required for live detection. Complete the steps below and click{" "}
            <strong>[ CHECK AGAIN ]</strong> for each step.
          </p>

          <div className="v2-vertical-setup-container">
            {/* STEP 01: NPCAP */}
            <div className="v2-vertical-step-card">
              <div className="v2-vertical-step-header">
                <div className="v2-vertical-step-left">
                  <span className="v2-vertical-step-num-badge">STEP 01</span>
                  <h4 className="v2-vertical-step-title">INSTALL NPCAP PACKET CAPTURE DRIVER</h4>
                </div>
                <span
                  className={`v2-vertical-step-status-badge ${
                    stepStates[1].status === "READY"
                      ? "ready"
                      : readiness?.npcap_driver.installed
                      ? "ready"
                      : "required"
                  }`}
                >
                  {stepStates[1].status === "READY" || readiness?.npcap_driver.installed ? (
                    <>
                      <Check size={13} /> INSTALLED
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} /> REQUIRED
                    </>
                  )}
                </span>
              </div>

              <div className="v2-vertical-step-grid">
                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <HelpCircle size={12} /> WHY THIS IS REQUIRED
                  </span>
                  <p className="v2-setup-section-text">
                    Npcap is a host-level Windows kernel packet capture driver. ORION-Z uses it to passively observe
                    real network traffic on Windows network interfaces in promiscuous mode without modifying or delaying
                    traffic. Npcap supplies the capture capability; ORION-Z performs all AI threat analysis.
                  </p>
                </div>

                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <ShieldCheck size={12} /> WHAT TO DO
                  </span>
                  <p className="v2-setup-section-text">
                    Download Npcap from the official Npcap website and install it on the monitored Windows machine.
                    During installation, ensure the option <strong>&quot;Install Npcap in WinPcap API-compatible Mode&quot;</strong>{" "}
                    is enabled.
                  </p>
                </div>
              </div>

              <div className="v2-setup-action-footer">
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  <strong>Requirement:</strong> Npcap packet capture driver installed on the monitored Windows host.
                </div>
                <button
                  className="v2-btn-secondary"
                  onClick={checkStep1}
                  disabled={stepStates[1].status === "CHECKING"}
                  style={{ fontSize: "11px", gap: "4px" }}
                >
                  <RefreshCw size={12} className={stepStates[1].status === "CHECKING" ? "animate-spin" : ""} />
                  <span>{stepStates[1].status === "CHECKING" ? "Checking Npcap..." : "Check Npcap"}</span>
                </button>
              </div>

              {stepStates[1].status === "NOT_READY" && (
                <div className="v2-step-inline-result failure">
                  <XCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✕ STEP NOT COMPLETE</strong>
                    <p>{stepStates[1].message}</p>
                  </div>
                </div>
              )}

              {stepStates[1].status === "READY" && (
                <div className="v2-step-inline-result success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✓ STEP COMPLETE</strong>
                    <p>{stepStates[1].message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="v2-vertical-connector">
              <ArrowDown size={18} />
            </div>

            {/* STEP 02: ADMIN PRIVILEGES */}
            <div className="v2-vertical-step-card">
              <div className="v2-vertical-step-header">
                <div className="v2-vertical-step-left">
                  <span className="v2-vertical-step-num-badge">STEP 02</span>
                  <h4 className="v2-vertical-step-title">ALLOW REQUIRED ADMINISTRATOR ACCESS</h4>
                </div>
                <span
                  className={`v2-vertical-step-status-badge ${
                    stepStates[2].status === "READY"
                      ? "ready"
                      : readiness?.admin_privileges.granted
                      ? "ready"
                      : "required"
                  }`}
                >
                  {stepStates[2].status === "READY" || readiness?.admin_privileges.granted ? (
                    <>
                      <Check size={13} /> GRANTED
                    </>
                  ) : (
                    <>
                      <Lock size={13} /> REQUIRED
                    </>
                  )}
                </span>
              </div>

              <div className="v2-vertical-step-grid">
                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <HelpCircle size={12} /> WHY THIS IS REQUIRED
                  </span>
                  <p className="v2-setup-section-text">
                    Windows operating systems restrict raw network socket binding and promiscuous packet access
                    unless the local backend process possesses elevated Administrator privileges. (The web browser
                    itself does NOT require administrator privileges—only the host sensor service requires elevated access).
                  </p>
                </div>

                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <ShieldCheck size={12} /> WHAT TO DO
                  </span>
                  <p className="v2-setup-section-text">
                    Start the ORION-Z local backend/sensor process from an <strong>elevated Administrator Command Prompt or PowerShell window</strong>.
                    Run: <code>.venv\Scripts\python -m uvicorn sih_detector.api:app --port 8000</code>.
                  </p>
                </div>
              </div>

              <div className="v2-setup-action-footer">
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  <strong>Requirement:</strong> Host backend process executed with Administrator privileges.
                </div>
                <button
                  className="v2-btn-secondary"
                  onClick={checkStep2}
                  disabled={stepStates[2].status === "CHECKING"}
                  style={{ fontSize: "11px", gap: "4px" }}
                >
                  <RefreshCw size={12} className={stepStates[2].status === "CHECKING" ? "animate-spin" : ""} />
                  <span>{stepStates[2].status === "CHECKING" ? "Checking Permissions..." : "Check Permissions"}</span>
                </button>
              </div>

              {stepStates[2].status === "NOT_READY" && (
                <div className="v2-step-inline-result failure">
                  <XCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✕ STEP NOT COMPLETE</strong>
                    <p>{stepStates[2].message}</p>
                  </div>
                </div>
              )}

              {stepStates[2].status === "READY" && (
                <div className="v2-step-inline-result success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✓ STEP COMPLETE</strong>
                    <p>{stepStates[2].message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="v2-vertical-connector">
              <ArrowDown size={18} />
            </div>

            {/* STEP 03: LIVE SENSOR SESSION */}
            <div className="v2-vertical-step-card">
              <div className="v2-vertical-step-header">
                <div className="v2-vertical-step-left">
                  <span className="v2-vertical-step-num-badge">STEP 03</span>
                  <h4 className="v2-vertical-step-title">START THE ORION-Z LIVE SENSOR</h4>
                </div>
                <span
                  className={`v2-vertical-step-status-badge ${
                    stepStates[3].status === "READY" || isRunning ? "ready" : "required"
                  }`}
                >
                  {stepStates[3].status === "READY" || isRunning ? (
                    <>
                      <Check size={13} /> RUNNING
                    </>
                  ) : (
                    <>
                      <WifiOff size={13} /> NOT CONNECTED
                    </>
                  )}
                </span>
              </div>

              <div className="v2-vertical-step-grid">
                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <HelpCircle size={12} /> WHY THIS IS REQUIRED
                  </span>
                  <p className="v2-setup-section-text">
                    The web browser application cannot directly capture raw Ethernet frames from client hardware due to browser security boundaries.
                    A local ORION-Z live sensor process must capture, aggregate, and transmit real telemetry over the WebSocket socket.
                  </p>
                </div>

                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <ShieldCheck size={12} /> WHAT TO DO
                  </span>
                  <p className="v2-setup-section-text">
                    Ensure the ORION-Z backend server is running. Then click <strong>[ Check Connection ]</strong> below or <strong>[ Start Live Detection ]</strong> above
                    to initialize the continuous passive capture session.
                  </p>
                </div>
              </div>

              <div className="v2-setup-action-footer">
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  <strong>Requirement:</strong> Continuous passive network capture session initialized.
                </div>
                <button
                  className="v2-btn-emerald"
                  onClick={checkStep3}
                  disabled={stepStates[3].status === "CHECKING"}
                  style={{ fontSize: "11px", gap: "4px" }}
                >
                  <RefreshCw size={12} className={stepStates[3].status === "CHECKING" ? "animate-spin" : ""} />
                  <span>{stepStates[3].status === "CHECKING" ? "Checking Connection..." : "Check Connection"}</span>
                </button>
              </div>

              {stepStates[3].status === "NOT_READY" && (
                <div className="v2-step-inline-result failure">
                  <XCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✕ STEP NOT COMPLETE</strong>
                    <p>{stepStates[3].message}</p>
                  </div>
                </div>
              )}

              {stepStates[3].status === "READY" && (
                <div className="v2-step-inline-result success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✓ STEP COMPLETE</strong>
                    <p>{stepStates[3].message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="v2-vertical-connector">
              <ArrowDown size={18} />
            </div>

            {/* STEP 04: NETWORK INTERFACE VERIFICATION */}
            <div className="v2-vertical-step-card">
              <div className="v2-vertical-step-header">
                <div className="v2-vertical-step-left">
                  <span className="v2-vertical-step-num-badge">STEP 04</span>
                  <h4 className="v2-vertical-step-title">VERIFY THE NETWORK INTERFACE</h4>
                </div>
                <span
                  className={`v2-vertical-step-status-badge ${
                    stepStates[4].status === "READY" || readiness?.network_interface?.name ? "ready" : "required"
                  }`}
                >
                  {stepStates[4].status === "READY" || readiness?.network_interface?.name ? (
                    <>
                      <Check size={13} /> DETECTED
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} /> NO USABLE INTERFACE
                    </>
                  )}
                </span>
              </div>

              <div className="v2-vertical-step-grid">
                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <HelpCircle size={12} /> WHY THIS IS REQUIRED
                  </span>
                  <p className="v2-setup-section-text">
                    ORION-Z needs an active physical or virtual host network adapter (such as Ethernet or Wi-Fi) from which it can observe passing IP traffic.
                  </p>
                </div>

                <div className="v2-setup-section-box">
                  <span className="v2-setup-section-label">
                    <Cpu size={12} /> DETECTED HOST INTERFACE
                  </span>
                  <p className="v2-setup-section-text" style={{ fontFamily: "DM Mono", fontWeight: 700 }}>
                    {readiness?.network_interface?.name || "NO USABLE CAPTURE INTERFACE DETECTED"}
                  </p>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Status: {readiness?.network_interface?.status || "Interface query pending"}
                  </span>
                </div>
              </div>

              <div className="v2-setup-action-footer">
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  <strong>Requirement:</strong> Active physical or virtual host network interface.
                </div>
                <button
                  className="v2-btn-secondary"
                  onClick={checkStep4}
                  disabled={stepStates[4].status === "CHECKING"}
                  style={{ fontSize: "11px", gap: "4px" }}
                >
                  <RefreshCw size={12} className={stepStates[4].status === "CHECKING" ? "animate-spin" : ""} />
                  <span>{stepStates[4].status === "CHECKING" ? "Checking Interface..." : "Check Interface"}</span>
                </button>
              </div>

              {stepStates[4].status === "NOT_READY" && (
                <div className="v2-step-inline-result failure">
                  <XCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✕ STEP NOT COMPLETE</strong>
                    <p>{stepStates[4].message}</p>
                  </div>
                </div>
              )}

              {stepStates[4].status === "READY" && (
                <div className="v2-step-inline-result success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✓ STEP COMPLETE</strong>
                    <p>{stepStates[4].message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="v2-vertical-connector">
              <ArrowDown size={18} />
            </div>

            {/* STEP 05: INITIATE LIVE MONITORING */}
            <div className="v2-vertical-step-card active-step">
              <div className="v2-vertical-step-header">
                <div className="v2-vertical-step-left">
                  <span className="v2-vertical-step-num-badge">STEP 05</span>
                  <h4 className="v2-vertical-step-title">START LIVE DETECTION</h4>
                </div>
                <span className="v2-vertical-step-status-badge ready">
                  <Play size={13} /> READY FOR TRIGGER
                </span>
              </div>

              <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: "1.5" }}>
                Once all prerequisites (Npcap packet driver, Administrator socket privileges, live sensor process, and host network interface) are verified,
                select <strong>[ START LIVE DETECTION ]</strong> to initiate continuous passive network threat monitoring.
              </p>

              <div className="v2-setup-action-footer">
                <button
                  className="v2-btn-emerald"
                  onClick={handleStep5Start}
                  disabled={stepStates[5].status === "CHECKING" || isRunning}
                  style={{ fontSize: "13px", padding: "8px 20px" }}
                >
                  <Play size={15} className={stepStates[5].status === "CHECKING" ? "animate-spin" : ""} />
                  <span>{stepStates[5].status === "CHECKING" ? "Verifying & Starting..." : "Start Live Detection"}</span>
                </button>
              </div>

              {stepStates[5].status === "NOT_READY" && (
                <div className="v2-step-inline-result failure">
                  <XCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✕ LIVE DETECTION NOT STARTED</strong>
                    <p>{stepStates[5].message}</p>
                  </div>
                </div>
              )}

              {stepStates[5].status === "READY" && (
                <div className="v2-step-inline-result success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>✓ STEP COMPLETE</strong>
                    <p>{stepStates[5].message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Technical Diagnostics Drawer */}
          <div className="v2-tech-details-wrap" style={{ marginTop: "20px" }}>
            <button
              className="v2-btn-secondary"
              style={{ fontSize: "11px", gap: "6px" }}
              onClick={() => setShowTechDetails(!showTechDetails)}
            >
              <span>Technical Diagnostics & Raw Socket Status</span>
              {showTechDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTechDetails && (
              <div className="v2-raw-diagnostic-box">
                <code>
                  {rawDiagnostic
                    ? rawDiagnostic
                    : "Raw socket probe status: No error recorded. Prerequisites appear to be met."}
                </code>
                {readiness && (
                  <code style={{ display: "block", marginTop: "8px", opacity: 0.75 }}>
                    {`OS: ${readiness.os}\n`}
                    {`Npcap: ${readiness.npcap_driver.status}\n`}
                    {`Admin: ${readiness.admin_privileges.status}\n`}
                    {`Network Interface: ${readiness.network_interface?.name || "—"} [${readiness.network_interface?.status || "—"}]`}
                  </code>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 5. LIVE MONITORING PARAMETERS (active when running) ════════════ */}
      <div className="v2-grid-4">
        <div className="v2-stat-card">
          <span className="v2-stat-label">Network Interface</span>
          <div className="v2-stat-value">
            {isRunning && realtimeMetrics?.interface_name
              ? realtimeMetrics.interface_name
              : "—"}
          </div>
          <div className="v2-stat-sub">
            {isRunning ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{isRunning ? "Promiscuous Tap Active" : "Tap Not Active"}</span>
          </div>
        </div>

        <div className="v2-stat-card">
          <span className="v2-stat-label">Live Flows Processed</span>
          <div className="v2-stat-value">
            {isRunning ? (realtimeMetrics?.flows_processed ?? 0).toLocaleString() : "N/A"}
          </div>
          <div className="v2-stat-sub">
            <Activity size={12} />
            <span>Real-time sliding window</span>
          </div>
        </div>

        <div className="v2-stat-card">
          <span className="v2-stat-label">Detection Latency</span>
          <div className="v2-stat-value">
            {isRunning ? `${(realtimeMetrics?.detection_time_ms ?? 0).toFixed(1)} ms` : "N/A"}
          </div>
          <div className="v2-stat-sub">
            <Zap size={12} />
            <span>Feature extraction + evaluation</span>
          </div>
        </div>

        <div className="v2-stat-card">
          <span className="v2-stat-label">Engine Uptime</span>
          <div className="v2-stat-value">
            {isRunning ? `${realtimeMetrics?.engine_uptime_seconds ?? 0} s` : "Offline"}
          </div>
          <div className="v2-stat-sub">
            <Clock size={12} />
            <span>Continuous background task</span>
          </div>
        </div>
      </div>

      {/* ═══ 6. LIVE VISUALIZATION CANVAS ════════════════════════════════════ */}
      <div className="v2-section-frame">
        <div className="v2-frame-header">
          <div className="v2-frame-title-wrap">
            <span className="v2-frame-kicker">LIVE VISUALIZATION</span>
            <h3 className="v2-frame-title">Passive Capture Network Stream</h3>
          </div>
          <div className="v2-frame-badge">
            <Layers size={13} />
            <span>9 ACTIVE DETECTORS</span>
          </div>
        </div>

        <div className="v2-viz-wrap">
          <RealTimeDetectionVisualization
            step={isRunning ? (latestAlert ? "scan_5" : "scan_1") : "ready"}
            identifiedThreat={isRunning ? latestAlert?.threat_class : undefined}
          />
        </div>
      </div>

      {/* ═══ 7. ATTACK EXPLAINER (only when genuinely live + threat detected) */}
      {latestAlert && isRunning && (
        <div className="v2-section-frame">
          <AttackExplainer
            scenario={latestAlert.threat_class}
            status={isRunning ? "running" : "stopped"}
            flows={flows}
            latestAlert={latestAlert}
            metrics={{
              processed_events: realtimeMetrics?.flows_processed ?? 0,
              alerts_generated: realtimeMetrics?.alerts_generated ?? 0,
              events_per_second: 0,
              average_alert_latency_ms: realtimeMetrics?.detection_time_ms ?? 0,
              scenario: latestAlert.threat_class,
              status: isRunning ? "running" : "stopped",
              running: isRunning,
              started_at: null,
              finished_at: null,
              threat_counts: {},
              error_count: 0,
            }}
          />
        </div>
      )}
    </div>
  );
};

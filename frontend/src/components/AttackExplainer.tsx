import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Cpu,
  Radio,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { Alert, FlowEvent, Metrics } from "../types";
import { AttackVisualizationRouter } from "./attack-graphics/AttackVisualizationRouter";

interface AttackExplainerProps {
  scenario: string;
  status: string;
  flows: FlowEvent[];
  latestAlert: Alert | null;
  metrics: Metrics;
  realtimeTargetThreat?: string;
}

export type ExplainerStep =
  | "ready"
  | "attack"
  | "observe"
  | "extract"
  | "evaluate"
  | "enrich"
  | "decision"
  | "complete"
  | "scan_1"
  | "scan_2"
  | "scan_3"
  | "scan_4"
  | "scan_5"
  | "transitioning"
  | "anomaly_scan_1"
  | "anomaly_scan_2"
  | "anomaly_scan_3"
  | "anomaly_scan_4"
  | "anomaly_scan_5"
  | "anomaly_complete";

export const REALTIME_CYCLE_ORDER = [
  "syn_flood",
  "port_scanning",
  "dns_tunnelling",
  "dga",
  "beaconing",
  "encrypted_session",
  "exfiltration",
  "udp_amplification",
  "slowloris",
] as const;

let globalRealtimeCycleIndex = 0;

export function getNextRealtimeThreat(): string {
  const threat = REALTIME_CYCLE_ORDER[globalRealtimeCycleIndex % REALTIME_CYCLE_ORDER.length];
  globalRealtimeCycleIndex = (globalRealtimeCycleIndex + 1) % REALTIME_CYCLE_ORDER.length;
  return threat;
}

interface ScenarioConfig {
  id: string;
  name: string;
  subtitle: string;
  protocol: string;
  sourceNode: string;
  targetNode: string;
  sensorNode: string;
  detectorId: string;
  whatIsHappening: string;
  howDetected: string;
  trafficType: string;
  features: {
    key: string;
    label: string;
    thresholdStr: string;
    unit?: string;
    evaluator: (alert: Alert | null, calculated: Record<string, number>) => {
      currVal: string | number;
      triggered: boolean;
    };
  }[];
}



const SCENARIO_CONFIGS: Record<string, ScenarioConfig> = {
  realtime_detection: {
    id: "realtime_detection",
    name: "Real-Time System Radar",
    subtitle: "Passive Telemetry Survey & Dynamic Threat Classification",
    protocol: "SYSTEM TAP / ALL PROTOCOLS",
    sourceNode: "ORION-Z SENSOR",
    targetNode: "ENCLAVE TRAFFIC",
    sensorNode: "LIVE TAP",
    detectorId: "radar_survey_v1",
    whatIsHappening:
      "ORION-Z is actively surveying network flow behavior across the passive enclave. Incoming flow metadata is continuously windowed and analyzed for threat signatures.",
    howDetected:
      "Telemetry stream is monitored across 15 window features. When anomalous behavior occurs, ORION-Z isolates the flow pattern and matches it against detector algorithms.",
    trafficType: "Multi-Protocol Live Telemetry Stream",
    features: [
      {
        key: "packets_per_second",
        label: "Ingest Rate",
        thresholdStr: "Live Stream",
        unit: "pkts/s",
        evaluator: (_alert, calc) => ({
          currVal: calc.packetsPerSec ? calc.packetsPerSec.toLocaleString() : "Active",
          triggered: false,
        }),
      },
      {
        key: "unique_hosts",
        label: "Monitored Hosts",
        thresholdStr: "Active Enclave",
        unit: "hosts",
        evaluator: (_alert, calc) => ({
          currVal: calc.uniqueHosts || "Surveying",
          triggered: false,
        }),
      },
    ],
  },
  anomaly_detection: {
    id: "anomaly_detection",
    name: "Behavioral Anomaly Detection",
    subtitle: "Isolation Forest & Non-Signature Pattern Analysis",
    protocol: "FLOW METADATA / 15-DIM VECTOR",
    sourceNode: "ENCLAVE SOURCES",
    targetNode: "BASELINE MODEL",
    sensorNode: "ISOLATION FOREST",
    detectorId: "isolation_forest_v1",
    whatIsHappening:
      "ORION-Z compares incoming flow windows against an established benign behavioral baseline to detect novel or unclassified network anomalies.",
    howDetected:
      "The local Isolation Forest model evaluates 15-dimensional window feature vectors. Windows exhibiting significant deviation from benign distributions raise an anomaly alert.",
    trafficType: "Unclassified Behavioral Flow Stream",
    features: [
      {
        key: "anomaly_score",
        label: "Isolation Forest Score",
        thresholdStr: "< 0.0 (Deviation)",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "ml_anomaly_score")?.value;
          const num = typeof v === "number" ? v : -0.418;
          return { currVal: num.toFixed(3), triggered: true };
        },
      },
      {
        key: "source_entropy",
        label: "Window Entropy",
        thresholdStr: "Baseline Deviation",
        evaluator: (_alert, calc) => ({
          currVal: calc.synRatio ? calc.synRatio.toFixed(3) : "0.785",
          triggered: true,
        }),
      },
    ],
  },
  syn_flood: {
    id: "syn_flood",
    name: "SYN Flood (Volumetric DDoS)",
    subtitle: "SYN Flag Saturation & Connection Pool Exhaustion",
    protocol: "TCP / Port 80, 443",
    sourceNode: "ATTACK SOURCE (192.168.1.105)",
    targetNode: "TARGET SERVER (10.0.0.1)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "syn_flood_v1",
    whatIsHappening:
      "The attacker transmits a massive flood of TCP SYN handshake requests without completing the 3-way handshake (no ACK). Target server socket tables become saturated with half-open connections, blocking legitimate traffic.",
    howDetected:
      "ORION-Z calculates real-time window metrics: SYN packet ratio (SYN/total), packet rate (pkts/sec), and incomplete connection ratio. When thresholds are breached, the rule engine raises a high-severity alert.",
    trafficType: "High-Volume Uncompleted TCP SYN Stream",
    features: [
      {
        key: "packets_per_second",
        label: "Packets Per Second",
        thresholdStr: "≥ 1000.0 pkts/s",
        unit: "pkts/s",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "packets_per_second")?.value ?? calc.packetsPerSec ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toLocaleString(), triggered: alert ? true : num >= 1000 };
        },
      },
      {
        key: "syn_ratio",
        label: "SYN Flag Ratio",
        thresholdStr: "≥ 0.80",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "syn_ratio")?.value ?? calc.synRatio ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toFixed(3), triggered: alert ? true : num >= 0.8 };
        },
      },
      {
        key: "incomplete_ratio",
        label: "Incomplete Connection Ratio",
        thresholdStr: "≥ 0.80",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "incomplete_ratio")?.value ?? calc.incompleteRatio ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toFixed(3), triggered: alert ? true : num >= 0.8 };
        },
      },
    ],
  },
  port_scanning: {
    id: "port_scanning",
    name: "Port Scanning (Reconnaissance)",
    subtitle: "Multi-Port Probe Fan-out Inspection",
    protocol: "TCP SYN/FIN Probe",
    sourceNode: "SCANNER HOST (192.168.1.88)",
    targetNode: "SUBNET RANGE (10.0.0.0/24)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "port_scan_v1",
    whatIsHappening:
      "An external host rapidly probes multiple sequential or randomized TCP/UDP destination ports across one or more IP addresses to discover active services and security gaps.",
    howDetected:
      "ORION-Z monitors unique destination ports and hosts targeted by each source IP within observation windows. Exceeding 20 unique target ports triggers immediate alert generation.",
    trafficType: "Multi-Port Low-Byte Probe Sweeps",
    features: [
      {
        key: "unique_destination_ports",
        label: "Unique Destination Ports",
        thresholdStr: "≥ 20 ports",
        unit: "ports",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "unique_destination_ports")?.value ?? calc.uniquePorts ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num, triggered: alert ? true : num >= 20 };
        },
      },
      {
        key: "unique_destination_hosts",
        label: "Unique Target Hosts",
        thresholdStr: "Fan-out Inspection",
        unit: "hosts",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "unique_destination_hosts")?.value ?? calc.uniqueHosts ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num, triggered: Boolean(alert) };
        },
      },
    ],
  },
  dns_tunnelling: {
    id: "dns_tunnelling",
    name: "DNS Data Tunnelling (Covert Channel)",
    subtitle: "Encoded Query Label Payload Exfiltration",
    protocol: "DNS / UDP Port 53",
    sourceNode: "COMPROMISED HOST (10.0.0.14)",
    targetNode: "EXTERNAL C2 DNS (198.51.100.12)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "dns_tunnelling_v1",
    whatIsHappening:
      "Attacker exfiltrates data or sends C2 commands by encoding binary payloads into DNS subdomain query labels (e.g. `a7f9b2c.tunnel.c2.net`), exploiting unblocked DNS traffic.",
    howDetected:
      "ORION-Z extracts DNS query strings, computing Shannon character entropy, query string lengths, and domain uniqueness ratios. High entropy combined with long query labels triggers detection.",
    trafficType: "High-Entropy Subdomain Query Stream",
    features: [
      {
        key: "query_entropy",
        label: "DNS Label Entropy",
        thresholdStr: "≥ 3.50 bits",
        unit: "bits",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "query_entropy")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num > 0 ? num.toFixed(2) : "Evaluating", triggered: alert ? true : num >= 3.5 };
        },
      },
      {
        key: "average_query_length",
        label: "Average Query Length",
        thresholdStr: "≥ 30 chars",
        unit: "chars",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "average_query_length")?.value ?? calc.avgQueryLen ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num, triggered: alert ? true : num >= 30 };
        },
      },
      {
        key: "unique_query_ratio",
        label: "Unique Query Ratio",
        thresholdStr: "≥ 0.75",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "unique_query_ratio")?.value ?? calc.uniqueDnsRatio ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toFixed(2), triggered: alert ? true : num >= 0.75 };
        },
      },
    ],
  },
  dga: {
    id: "dga",
    name: "Domain Generation Algorithm (DGA C2)",
    subtitle: "Pseudo-Random Domain Query Analysis",
    protocol: "DNS / UDP Port 53",
    sourceNode: "INFECTED ENDPOINT (10.0.0.22)",
    targetNode: "UPSTREAM RESOLVER (8.8.8.8)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "dga_detector_v1",
    whatIsHappening:
      "Malware on a compromised endpoint dynamically generates hundreds of pseudo-random domain names to locate active Command & Control servers while defeating static blocklists.",
    howDetected:
      "ORION-Z applies lexical analysis to DNS query strings to compute a DGA score alongside query frequency and unique domain ratios.",
    trafficType: "Randomized Domain Lookup Sequences",
    features: [
      {
        key: "dga_lexical_score",
        label: "DGA Lexical Score",
        thresholdStr: "≥ 0.68",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "dga_lexical_score")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num > 0 ? num.toFixed(3) : "Evaluating", triggered: alert ? true : num >= 0.68 };
        },
      },
      {
        key: "unique_query_ratio",
        label: "Unique Domain Ratio",
        thresholdStr: "≥ 0.80",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "unique_query_ratio")?.value ?? calc.uniqueDnsRatio ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toFixed(2), triggered: alert ? true : num >= 0.8 };
        },
      },
      {
        key: "dga_query_count",
        label: "Suspicious Query Count",
        thresholdStr: "≥ 6 queries",
        unit: "queries",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "dga_query_count")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num || "Evaluating", triggered: alert ? true : num >= 6 };
        },
      },
    ],
  },
  beaconing: {
    id: "beaconing",
    name: "Botnet C2 Beaconing",
    subtitle: "Periodic Inter-Arrival Time Regularity",
    protocol: "TCP/UDP / Port 443, 8443",
    sourceNode: "INFECTED HOST (10.0.0.31)",
    targetNode: "REMOTE C2 SERVER (198.51.100.44)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "beaconing_v1",
    whatIsHappening:
      "A compromised internal machine repeatedly communicates with a remote C2 server at highly regular intervals (clock-like timing) to maintain connectivity and await commands.",
    howDetected:
      "ORION-Z analyzes connection inter-arrival times to calculate a periodicity score. Strong periodic clustering to a single destination triggers a beaconing alert.",
    trafficType: "Clock-Like Periodic Contact Pulses",
    features: [
      {
        key: "periodicity_score",
        label: "Periodicity Score",
        thresholdStr: "≥ 0.85",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "periodicity_score")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num > 0 ? num.toFixed(3) : "Evaluating", triggered: alert ? true : num >= 0.85 };
        },
      },
      {
        key: "recurring_destination",
        label: "Recurring Destination",
        thresholdStr: "Repeated Contact Pattern",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "recurring_destination")?.value;
          return { currVal: (v as string) || "Inspecting", triggered: Boolean(alert) };
        },
      },
      {
        key: "beacon_event_count",
        label: "Beacon Event Count",
        thresholdStr: "≥ 5 events",
        unit: "events",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "beacon_event_count")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num || "Evaluating", triggered: alert ? true : num >= 5 };
        },
      },
    ],
  },
  encrypted_session: {
    id: "encrypted_session",
    name: "Encrypted TLS Anomaly",
    subtitle: "Passive TLS Handshake & Packet Profile Inspection",
    protocol: "TLS 1.3 / Port 443",
    sourceNode: "LOCAL ENDPOINT (10.0.0.18)",
    targetNode: "SUSPICIOUS HOST (203.0.113.19)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "encrypted_anomaly_v1",
    whatIsHappening:
      "An encrypted TLS/QUIC session exhibits anomalous metadata characteristics—such as unaligned SNI declarations, abnormal cipher suites, or irregular packet size distributions.",
    howDetected:
      "Without decrypting any payload, ORION-Z evaluates passive handshake headers and packet length histograms to calculate a composite TLS metadata anomaly score.",
    trafficType: "Anomalous TLS Handshake & Size Distribution",
    features: [
      {
        key: "tls_metadata_score",
        label: "TLS Metadata Anomaly Score",
        thresholdStr: "≥ 0.70",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "tls_metadata_score")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num > 0 ? num.toFixed(3) : "Evaluating", triggered: alert ? true : num >= 0.7 };
        },
      },
      {
        key: "tls_fingerprint",
        label: "TLS Fingerprint Signature",
        thresholdStr: "Passive Handshake Metadata",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "tls_fingerprint")?.value;
          return { currVal: (v as string) || "Inspecting", triggered: Boolean(alert) };
        },
      },
    ],
  },
  exfiltration: {
    id: "exfiltration",
    name: "Data Exfiltration (Outbound Burst)",
    subtitle: "Asymmetric Outbound Volume Thresholding",
    protocol: "TCP / Port 443, 8080",
    sourceNode: "INTERNAL DATA STORE (10.0.0.50)",
    targetNode: "EXTERNAL SINK (203.0.113.88)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "exfiltration_v1",
    whatIsHappening:
      "A large volume of internal data is transferred outbound to an unclassified external destination, presenting a heavy directional byte asymmetry relative to inbound traffic.",
    howDetected:
      "ORION-Z measures total cumulative outbound bytes and computes the outbound-to-inbound byte ratio over 30-second windows.",
    trafficType: "High-Volume Asymmetric Outbound Data Transfer",
    features: [
      {
        key: "outbound_bytes",
        label: "Outbound Bytes Transferred",
        thresholdStr: "≥ 100,000 B",
        unit: "B",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "outbound_bytes")?.value ?? calc.outboundBytes ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toLocaleString(), triggered: alert ? true : num >= 100000 };
        },
      },
      {
        key: "outbound_inbound_ratio",
        label: "Outbound / Inbound Ratio",
        thresholdStr: "≥ 10.0 Asymmetric",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "outbound_inbound_ratio")?.value ?? calc.outboundRatio ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toFixed(2), triggered: alert ? true : num >= 10.0 };
        },
      },
    ],
  },
  udp_amplification: {
    id: "udp_amplification",
    name: "Reflected UDP Amplification DDoS",
    subtitle: "Reflector Request Spoofing & Volume Amplification",
    protocol: "UDP / Ports 53, 123, 1900, 11211",
    sourceNode: "ATTACKER (SPOOFED)",
    targetNode: "VICTIM HOST (10.0.0.2)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "udp_amplification_v1",
    whatIsHappening:
      "Attacker sends small spoofed requests to open Internet reflection servers (DNS/NTP/SSDP), which return massive payload responses directed at the victim IP.",
    howDetected:
      "ORION-Z tracks UDP packet volume arriving from known amplification protocol ports across multiple distinct source IP addresses within short time windows.",
    trafficType: "Amplified Reflected UDP Response Flood",
    features: [
      {
        key: "udp_packets_per_second",
        label: "UDP Packets Per Second",
        thresholdStr: "≥ 50.0 pkts/s",
        unit: "pkts/s",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "udp_packets_per_second")?.value ?? calc.packetsPerSec ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num.toLocaleString(), triggered: alert ? true : num >= 50 };
        },
      },
      {
        key: "distinct_sources",
        label: "Distinct Source Reflectors",
        thresholdStr: "≥ 4 Reflector IPs",
        unit: "sources",
        evaluator: (alert, calc) => {
          const v = alert?.evidence.find((e) => e.feature === "distinct_sources")?.value ?? calc.uniqueHosts ?? 0;
          const num = typeof v === "number" ? v : Number(v) || 0;
          return { currVal: num, triggered: alert ? true : num >= 4 };
        },
      },
    ],
  },
  slowloris: {
    id: "slowloris",
    name: "Slowloris HTTP Exhaustion",
    subtitle: "Low & Slow Connection Pool Depletion",
    protocol: "TCP / Port 80, 8080",
    sourceNode: "ATTACK HOST (192.168.1.19)",
    targetNode: "WEB SERVER (10.0.0.1)",
    sensorNode: "ORION-Z PASSIVE TAP",
    detectorId: "slowloris_v1",
    whatIsHappening:
      "Attacker opens numerous HTTP connections to the web server and sends partial HTTP headers at minimal rates, holding connection threads open until the server pool is exhausted.",
    howDetected:
      "ORION-Z identifies streams maintaining multiple open connections with minimal byte transfer and low connection creation rates over window intervals.",
    trafficType: "Low-Bandwidth Held-Open Connection Pool",
    features: [
      {
        key: "held_open_connections",
        label: "Held Open Connections",
        thresholdStr: "≥ 8 connections",
        unit: "conns",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "held_open_connections")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num || "Evaluating", triggered: alert ? true : num >= 8 };
        },
      },
      {
        key: "average_bytes_per_connection",
        label: "Avg Bytes / Connection",
        thresholdStr: "≤ 2000 Bytes",
        unit: "B",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "average_bytes_per_connection")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num || "Evaluating", triggered: Boolean(alert) };
        },
      },
      {
        key: "connection_rate_per_second",
        label: "Connection Rate",
        thresholdStr: "≤ 1.0 conn/s",
        unit: "conn/s",
        evaluator: (alert) => {
          const v = alert?.evidence.find((e) => e.feature === "connection_rate_per_second")?.value;
          const num = typeof v === "number" ? v : 0;
          return { currVal: num || "Evaluating", triggered: Boolean(alert) };
        },
      },
    ],
  },
};

export function AttackExplainer({
  scenario,
  status,
  flows,
  latestAlert,
  metrics,
  realtimeTargetThreat,
}: AttackExplainerProps) {
  const isRunning = status === "running" || metrics.running === true;
  const isStopped = status === "stopped";
  const hasFlows = flows.length > 0;

  // Cinematic internal state machine step
  const [currentStep, setCurrentStep] = useState<ExplainerStep>("ready");
  // Resolved threat for REAL-TIME DETECTION mode
  const [resolvedThreat, setResolvedThreat] = useState<string | null>(null);

  // Determine active scenario ID for config lookup
  const activeScenarioId =
    scenario === "realtime_detection" &&
    resolvedThreat &&
    ["attack", "observe", "extract", "evaluate", "enrich", "decision", "complete"].includes(currentStep)
      ? resolvedThreat
      : scenario;

  const config = SCENARIO_CONFIGS[activeScenarioId] || SCENARIO_CONFIGS.syn_flood;

  // Timer & state refs for robust, persistent state management
  const timerRef = useRef<number[]>([]);
  const prevScenarioRef = useRef(scenario);
  // Session counter: each new replay increments this. Timer callbacks capture the session at
  // schedule time and bail out if the session has changed when they fire, preventing any
  // stale timer from corrupting a newer replay.
  const replaySessionRef = useRef(0);
  // Tracks the previous isRunning value so Effect 3 can detect a false→true edge without
  // depending on currentStep (which would re-run the effect on every step transition).
  const prevIsRunningRef = useRef(false);

  const activeReplayId = metrics.replay_id || null;
  const lastHandledReplayIdRef = useRef<string | null>(null);

  const clearTimers = () => {
    timerRef.current.forEach((id) => clearTimeout(id));
    timerRef.current = [];
  };

  // Schedule a step change that belongs to `session`. If the session has rotated
  // by the time the timer fires, the callback is a no-op.
  const addTimer = (step: ExplainerStep, delayMs: number, session: number) => {
    const id = window.setTimeout(() => {
      if (replaySessionRef.current !== session) return; // stale — a newer replay owns the explainer
      setCurrentStep(step);
    }, delayMs);
    timerRef.current.push(id);
  };

  // 1. SCENARIO CHANGE: Only scenario change resets the explainer back to READY
  useEffect(() => {
    if (prevScenarioRef.current !== scenario) {
      prevScenarioRef.current = scenario;
      clearTimers();
      replaySessionRef.current += 1; // invalidate any in-flight timers
      lastHandledReplayIdRef.current = null;
      setResolvedThreat(null);
      setCurrentStep("ready");
    }
  }, [scenario]);

  // 2. STOP BEHAVIOR: Freeze timer chain on stop without resetting currentStep
  useEffect(() => {
    if (isStopped) {
      clearTimers();
      replaySessionRef.current += 1; // invalidate any in-flight timers so they don't fire after stop
    }
  }, [isStopped]);

  // 3. CINEMATIC TIMELINE RUNNER: Starts wall-clock sequence on the false→true edge of isRunning.
  // CRITICAL: currentStep is NOT in the dependency array. This effect must only run when isRunning
  // itself changes (or scenario/realtimeTargetThreat changes).
  useEffect(() => {
    const wasRunning = prevIsRunningRef.current;
    prevIsRunningRef.current = isRunning;

    // Only launch a new cinematic sequence on a genuine false→true transition.
    if (!isRunning || wasRunning) return;

    // Avoid restarting an already handled/completed replay session
    if (activeReplayId && activeReplayId === lastHandledReplayIdRef.current && (status === "completed" || status === "stopped")) {
      return;
    }
    if (activeReplayId) {
      lastHandledReplayIdRef.current = activeReplayId;
    }

    // New replay: cancel all previous timers and mint a new session.
    clearTimers();
    const session = replaySessionRef.current + 1;
    replaySessionRef.current = session;

    if (scenario === "realtime_detection") {
      setCurrentStep("scan_1");
      const picked = realtimeTargetThreat || getNextRealtimeThreat();
      setResolvedThreat(picked);

      addTimer("scan_2", 800, session);
      addTimer("scan_3", 1600, session);
      addTimer("scan_4", 2400, session);
      addTimer("scan_5", 3200, session);

      const t1 = window.setTimeout(() => {
        if (replaySessionRef.current !== session) return;
        setCurrentStep("transitioning");
        const t2 = window.setTimeout(() => {
          if (replaySessionRef.current !== session) return;
          setCurrentStep("attack");
          addTimer("observe", 1000, session);
          addTimer("extract", 2000, session);
          addTimer("evaluate", 3000, session);
          addTimer("enrich", 4000, session);
          addTimer("decision", 4500, session);
        }, 200);
        timerRef.current.push(t2);
      }, 4000);
      timerRef.current.push(t1);
    } else if (scenario === "anomaly_detection") {
      setCurrentStep("anomaly_scan_1");
      addTimer("anomaly_scan_2", 1000, session);
      addTimer("anomaly_scan_3", 2000, session);
      addTimer("anomaly_scan_4", 3000, session);
      addTimer("anomaly_scan_5", 4000, session);
    } else {
      setCurrentStep("attack");
      addTimer("observe", 1000, session);
      addTimer("extract", 2000, session);
      addTimer("evaluate", 3000, session);
      addTimer("enrich", 4000, session);
      addTimer("decision", 4500, session);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, scenario, realtimeTargetThreat, activeReplayId]);

  // 4. GATED COMPLETION EFFECT:
  // Transition to "complete" synchronously when backend status is "completed".
  useEffect(() => {
    const isBackendComplete = status === "completed";

    if (isBackendComplete && !isStopped) {
      clearTimers();
      if (scenario === "anomaly_detection") {
        if (currentStep !== "anomaly_complete") {
          setCurrentStep("anomaly_complete");
        }
      } else if (currentStep !== "complete") {
        setCurrentStep("complete");
      }
    }
  }, [currentStep, status, isStopped, scenario]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearTimers();
  }, []);

  // Calculate live flow metrics for real-time evaluation
  const calculatedMetrics = useMemo<Record<string, number>>(() => {
    if (!hasFlows) {
      return {
        packetsPerSec: 0,
        totalBytes: 0,
        synRatio: 0,
        incompleteRatio: 0,
        uniquePorts: 0,
        uniqueHosts: 0,
        uniqueDnsRatio: 0,
        avgQueryLen: 0,
        outboundBytes: 0,
        outboundRatio: 0,
      };
    }

    const totalPkts = flows.reduce((sum, f) => sum + f.packets, 0);
    const totalB = flows.reduce((sum, f) => sum + f.bytes, 0);
    const timeSpan = Math.max(
      1,
      (new Date(flows[0].timestamp).getTime() -
        new Date(flows[flows.length - 1].timestamp).getTime()) /
        1000
    );

    const packetsPerSec = Math.round(totalPkts / timeSpan);
    const synEvents = flows.filter((f) => f.tcp_flags?.includes("SYN")).length;
    const synRatio = Number((synEvents / flows.length).toFixed(3));
    const incompleteEvents = flows.filter((f) => f.connection_completed === false).length;
    const incompleteRatio = Number((incompleteEvents / flows.length).toFixed(3));
    const uniquePorts = new Set(flows.map((f) => f.destination_port)).size;
    const uniqueHosts = new Set(flows.map((f) => f.destination_ip)).size;

    const dnsQueries = flows.filter((f) => Boolean(f.dns_query));
    const uniqueDnsQueries = new Set(dnsQueries.map((f) => f.dns_query)).size;
    const uniqueDnsRatio = dnsQueries.length > 0 ? Number((uniqueDnsQueries / dnsQueries.length).toFixed(3)) : 0;
    const avgQueryLen =
      dnsQueries.length > 0
        ? Math.round(
            dnsQueries.reduce((sum, f) => sum + (f.dns_query?.length || 0), 0) / dnsQueries.length
          )
        : 0;

    const outboundB = flows
      .filter((f) => f.direction === "outbound")
      .reduce((sum, f) => sum + f.bytes, 0);
    const inboundB = flows
      .filter((f) => f.direction === "inbound")
      .reduce((sum, f) => sum + f.bytes, 0);
    const outboundRatio = Number((outboundB / Math.max(1, inboundB)).toFixed(2));

    return {
      packetsPerSec,
      totalBytes: totalB,
      synRatio,
      incompleteRatio,
      uniquePorts,
      uniqueHosts,
      uniqueDnsRatio,
      avgQueryLen,
      outboundBytes: outboundB,
      outboundRatio,
    };
  }, [flows, hasFlows]);

  // Extract ML evidence
  const mlPrediction = latestAlert?.evidence.find((e) => e.feature === "ml_prediction")?.value as string | undefined;
  const mlAnomalyScore = latestAlert?.evidence.find((e) => e.feature === "ml_anomaly_score")?.value as number | undefined;

  // Determine stage active state
  const isObservePhase = ["observe", "extract", "evaluate", "enrich", "decision", "complete"].includes(currentStep);
  const isExtractPhase = ["extract", "evaluate", "enrich", "decision", "complete"].includes(currentStep);
  const isEvalPhase = ["evaluate", "enrich", "decision", "complete"].includes(currentStep);
  const isEnrichPhase = ["enrich", "decision", "complete"].includes(currentStep);
  const isDecisionPhase = ["decision", "complete"].includes(currentStep);
  const isAnomalyComplete = currentStep === "anomaly_complete";

  // Status Pill Color & Label
  const stateColor = isStopped
    ? "#F59E0B"
    : currentStep === "ready"
    ? "#7C8785"
    : isAnomalyComplete
    ? "#F59E0B"
    : isDecisionPhase && latestAlert
    ? "#EF4444"
    : "#00D084";

  const labelsMap: Record<ExplainerStep, string> = {
    ready: "READY · PRESS START REPLAY TO OBSERVE",
    attack: "PHASE 1 · ATTACK TRAFFIC GENERATING",
    observe: "PHASE 2 · ORION-Z PASSIVE OBSERVER ACTIVE",
    extract: "PHASE 3 · TELEMETRY FEATURE EXTRACTION",
    evaluate: "PHASE 4 · RULE ENGINE EVALUATION",
    enrich: "PHASE 5 · ML MODEL ENRICHMENT",
    decision: latestAlert ? "PHASE 6 · THREAT CONFIRMED & ALERT DISPATCHED" : "PHASE 6 · AWAITING DETECTOR CONFIRMATION",
    complete: latestAlert ? "SEQUENCE COMPLETED · THREAT DETECTED" : "SEQUENCE COMPLETED · MONITORING ACTIVE",
    scan_1: "0–1s · REAL-TIME NETWORK SCAN & FLOW OBSERVATION",
    scan_2: "1–2s · BEHAVIORAL ANALYSIS ACTIVE",
    scan_3: "2–3s · MULTIPLE FLOW WINDOWS CHECKED",
    scan_4: "3–4s · SIGNATURE & BEHAVIOR ANALYSIS IN PROGRESS",
    scan_5: "4–5s · THREAT CLASSIFICATION IN PROGRESS",
    transitioning: `THREAT ISOLATED: ${resolvedThreat?.toUpperCase() || "CLASSIFYING"}`,
    anomaly_scan_1: "0–1s · NORMAL BEHAVIORAL BASELINE MONITORING",
    anomaly_scan_2: "1–2s · BEHAVIORAL DEVIATION DETECTED",
    anomaly_scan_3: "2–3s · UNUSUAL PATTERN SCORING (ISOLATION FOREST)",
    anomaly_scan_4: "3–4s · NO KNOWN THREAT SIGNATURE MATCHED",
    anomaly_scan_5: "4–5s · ANOMALY CONFIDENCE & FINAL ANALYSIS",
    anomaly_complete: "UNKNOWN ANOMALY DETECTED · NON-SIGNATURE PATTERN",
  };

  const stateLabel = isStopped
    ? "SIMULATION STOPPED · REPLAY HALTED"
    : labelsMap[currentStep] || "MONITORING ACTIVE";

  return (
    <section className="attack-explainer-panel">
      {/* 1. TOP HEADER & METADATA BAR */}
      <div className="explainer-header">
        <div className="explainer-title-group">
          <div className="explainer-kicker-strip">
            <span className="explainer-kicker">VISUAL THREAT MECHANISM</span>
            <span className="explainer-protocol-badge">{config.protocol}</span>
          </div>
          <h2 className="explainer-main-title">{config.name}</h2>
          <p className="explainer-subtitle">{config.subtitle}</p>
        </div>

        <div className="explainer-status-pill-group">
          <div className="explainer-status-pill" style={{ borderColor: stateColor }}>
            <span className="explainer-pulse-dot" style={{ background: stateColor }} />
            <span className="explainer-status-text" style={{ color: stateColor }}>
              {stateLabel}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CINEMATIC TACTICAL NETWORK MAP (MODULAR SCENARIO VISUALIZATIONS) */}
      <div className="tactical-map-container">
        <AttackVisualizationRouter
          scenario={scenario}
          step={currentStep}
          latestAlert={latestAlert}
          flows={flows}
          metrics={metrics}
          resolvedThreat={resolvedThreat || undefined}
        />
      </div>

      {/* 3. THREE-COLUMN EXPLAINER & ENGINE TRANSPARENCY DECK */}
      <div className="explainer-cards-grid">
        {/* CARD 1: WHAT IS HAPPENING & HOW ORION-Z DETECTS IT */}
        <div className="explainer-deck-card">
          <div className="deck-card-header">
            <Radio size={15} style={{ color: "#00D084" }} />
            <span className="deck-card-title">ATTACK MECHANISM</span>
          </div>
          <div className="deck-card-body">
            <div className="mechanism-block">
              <span className="mech-label">WHAT IS HAPPENING?</span>
              <p className="mech-desc">{config.whatIsHappening}</p>
            </div>
            <div className="mechanism-block" style={{ marginTop: "12px" }}>
              <span className="mech-label" style={{ color: "#30B894" }}>HOW ORION-Z DETECTS IT</span>
              <p className="mech-desc">{config.howDetected}</p>
            </div>
          </div>
        </div>

        {/* CARD 2: DETECTION ALGORITHM & FEATURE EVALUATION */}
        <div className="explainer-deck-card">
          <div className="deck-card-header">
            <ShieldCheck size={15} style={{ color: "#00D084" }} />
            <span className="deck-card-title">DETECTION ALGORITHM</span>
            <span className="detector-id-tag mono-text">{config.detectorId}</span>
          </div>
          <div className="deck-card-body">
            <div className="feature-eval-table">
              <div className="eval-table-header">
                <span>FEATURE</span>
                <span>OBSERVED</span>
                <span>THRESHOLD</span>
                <span>STATE</span>
              </div>
              {config.features.map((feat) => {
                const evalResult = feat.evaluator(latestAlert, calculatedMetrics);
                const isFired = isAnomalyComplete || (isDecisionPhase && Boolean(latestAlert));
                return (
                  <div key={feat.key} className={`eval-table-row ${isFired && evalResult.triggered ? "triggered" : ""}`}>
                    <span className="feat-name mono-text">{feat.label}</span>
                    <span className="feat-val mono-text">
                      {isExtractPhase || isAnomalyComplete || scenario === "realtime_detection" || scenario === "anomaly_detection"
                        ? `${evalResult.currVal} ${feat.unit || ""}`
                        : "Waiting"}
                    </span>
                    <span className="feat-thresh mono-text">{feat.thresholdStr}</span>
                    <span className="feat-status">
                      {isFired && evalResult.triggered ? (
                        <span className="status-badge-triggered" style={{ color: isAnomalyComplete ? "#F59E0B" : "#EF4444" }}>
                          ✓ {isAnomalyComplete ? "ANOMALY" : "FIRED"}
                        </span>
                      ) : isEvalPhase ? (
                        <span className="status-badge-eval">EVAL</span>
                      ) : (
                        <span className="status-badge-idle">WAIT</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CARD 3: ML ENRICHMENT & FINAL DECISION */}
        <div className="explainer-deck-card">
          <div className="deck-card-header">
            <Cpu size={15} style={{ color: "#00D084" }} />
            <span className="deck-card-title">ML &amp; FINAL THREAT DECISION</span>
          </div>
          <div className="deck-card-body">
            {/* ML LAYER ROW */}
            <div className="ml-summary-box">
              <div className="ml-summary-row">
                <span className="ml-sum-lbl">MODEL ENRICHMENT</span>
                <span className="ml-sum-val mono-text">
                  {latestAlert?.model_version || (metrics.model_status?.available ? metrics.model_status.version : "rules-only")}
                </span>
              </div>
              <div className="ml-summary-row">
                <span className="ml-sum-lbl">ML PREDICTION</span>
                <span className="ml-sum-val mono-text" style={{ color: mlPrediction && isEnrichPhase ? "#00D084" : "#7C8785" }}>
                  {isAnomalyComplete
                    ? "unknown_anomaly"
                    : isEnrichPhase && mlPrediction
                    ? mlPrediction
                    : isEnrichPhase
                    ? "Scoring Window..."
                    : "Awaiting Enrichment"}
                </span>
              </div>
              <div className="ml-summary-row">
                <span className="ml-sum-lbl">ANOMALY SCORE</span>
                <span className="ml-sum-val mono-text">
                  {isAnomalyComplete
                    ? (mlAnomalyScore !== undefined ? mlAnomalyScore.toFixed(4) : "-0.4180 (Deviant)")
                    : isEnrichPhase && mlAnomalyScore !== undefined
                    ? mlAnomalyScore.toFixed(4)
                    : "0.0000 (Baseline)"}
                </span>
              </div>
            </div>

            {/* FINAL DECISION BADGE */}
            <div className={`threat-decision-hero ${isDecisionPhase && latestAlert ? "confirmed" : isAnomalyComplete ? "confirmed" : ""}`}
                 style={isAnomalyComplete ? { backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.4)", boxShadow: "0 0 16px rgba(245, 158, 11, 0.15)" } : undefined}>
              {isAnomalyComplete ? (
                <>
                  <div className="hero-decision-top">
                    <ShieldAlert size={18} style={{ color: "#F59E0B" }} />
                    <span className="hero-decision-title" style={{ color: "#F59E0B" }}>UNKNOWN ANOMALY</span>
                    <span className="badge-soc medium" style={{ marginLeft: "auto", background: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>
                      MEDIUM
                    </span>
                  </div>
                  <div className="hero-decision-meta mono-text">
                    <span>Confidence: 88%</span>
                    <span>·</span>
                    <span>Detector: isolation_forest_v1</span>
                  </div>
                  <div style={{ fontSize: "9px", color: "#F59E0B", fontFamily: "Space Mono, monospace", marginTop: "2px" }}>
                    ANOMALY DETECTION DEMONSTRATION
                  </div>
                </>
              ) : isDecisionPhase && latestAlert ? (
                <>
                  <div className="hero-decision-top">
                    <ShieldAlert size={18} style={{ color: "#EF4444" }} />
                    <span className="hero-decision-title">{latestAlert.threat_class.toUpperCase()}</span>
                    <span className={`badge-soc ${latestAlert.severity}`} style={{ marginLeft: "auto" }}>
                      {latestAlert.severity}
                    </span>
                  </div>
                  <div className="hero-decision-meta mono-text">
                    <span>Confidence: {Math.round(latestAlert.confidence * 100)}%</span>
                    <span>·</span>
                    <span>Detector: {latestAlert.detector}</span>
                  </div>
                </>
              ) : (
                <div className="hero-decision-standby">
                  <Activity size={16} style={{ color: isStopped ? "#F59E0B" : "#30B894" }} />
                  <span>
                    {currentStep === "ready"
                      ? "READY FOR REPLAY — Select START REPLAY to observe sequence."
                      : isStopped
                      ? "Replay paused. Click Start Replay to resume."
                      : scenario === "realtime_detection" && ["scan_1", "scan_2", "scan_3", "transitioning"].includes(currentStep)
                      ? "SURVEYING PASSIVE ENCLAVE TELEMETRY..."
                      : scenario === "anomaly_detection"
                      ? "EVALUATING 15-DIM FEATURE VECTOR DEVIATION..."
                      : isDecisionPhase && !latestAlert
                      ? "AWAITING DETECTOR CONFIRMATION..."
                      : !isObservePhase
                      ? "Generating attack traffic stream..."
                      : !isExtractPhase
                      ? "Observing live traffic stream..."
                      : !isEvalPhase
                      ? "Extracting telemetry features..."
                      : !isEnrichPhase
                      ? "Evaluating detector rule engine..."
                      : "Applying ML enrichment score..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

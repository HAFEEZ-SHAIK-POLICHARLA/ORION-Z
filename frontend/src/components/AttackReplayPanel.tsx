import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Eye,
  Layers,
  Lock,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Alert, FlowEvent, Metrics } from "../types";

interface AttackReplayPanelProps {
  scenario: string;
  status: string;
  flows: FlowEvent[];
  latestAlert: Alert | null;
  metrics: Metrics;
}

interface FeatureCondition {
  label: string;
  featureKey: string;
  currentValue: string | number;
  threshold: string;
  triggered: boolean;
  reason?: string;
  unit?: string;
}

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
  realtime_detection: "REAL-TIME DETECTION",
  anomaly_detection: "ANOMALY DETECTION",
};

const SCENARIO_DESCRIPTIONS: Record<string, { behavior: string; looking_for: string; protocol: string }> = {
  realtime_detection: {
    behavior: "Real-time survey — ORION-Z continuously observes passive enclave traffic and isolates threat patterns.",
    looking_for: "Multi-protocol flow telemetry continuous window feature extraction and real-time signature matching.",
    protocol: "ALL METADATA",
  },
  anomaly_detection: {
    behavior: "Behavioral anomaly monitoring — Isolation Forest evaluates 15-dimensional window features against benign baseline.",
    looking_for: "Non-signature statistical deviation from baseline distributions without payload access.",
    protocol: "15-DIM VECTOR",
  },
  syn_flood: {
    behavior: "Volumetric DDoS — attacker floods TCP SYN packets without completing handshakes, exhausting server state tables.",
    looking_for: "High packet rate, SYN flag dominance, and a high ratio of incomplete TCP connections in a 30s window.",
    protocol: "TCP",
  },
  port_scanning: {
    behavior: "Reconnaissance — attacker systematically probes many destination ports on a target to map open services.",
    looking_for: "A single source IP contacting ≥ 20 unique destination ports within the observation window.",
    protocol: "TCP",
  },
  dns_tunnelling: {
    behavior: "Covert channel — attacker encodes data or C2 traffic in DNS query labels to exfiltrate data or bypass firewalls.",
    looking_for: "High Shannon entropy, long DNS query labels, and high uniqueness ratio across ≥ 8 DNS queries.",
    protocol: "DNS/UDP",
  },
  dga: {
    behavior: "Malware C2 evasion — infected host contacts algorithmically generated domain names to locate its command & control server.",
    looking_for: "High average lexical DGA score across ≥ 6 non-TXT DNS queries with high unique domain ratio.",
    protocol: "DNS/UDP",
  },
  beaconing: {
    behavior: "Botnet check-in — compromised host periodically calls back to a C2 server at a very regular interval.",
    looking_for: "High periodicity score (clock-like regularity) across ≥ 5 completed connections to the same destination.",
    protocol: "TCP/UDP",
  },
  encrypted_session: {
    behavior: "Encrypted anomaly — TLS/QUIC session with suspicious handshake metadata or packet-size signature.",
    looking_for: "Composite TLS metadata anomaly score ≥ 0.70, derived from fingerprint and packet-size distribution only.",
    protocol: "TLS/QUIC",
  },
  exfiltration: {
    behavior: "Data theft — large volume of outbound data transferred asymmetrically relative to inbound traffic.",
    looking_for: "Cumulative outbound bytes ≥ 100 KB and outbound/inbound byte ratio ≥ 10 from the same source in a 30s window.",
    protocol: "TCP/UDP",
  },
  udp_amplification: {
    behavior: "Reflected DDoS — attacker sends spoofed UDP requests to amplification services (DNS/NTP/SSDP), which reply to the victim.",
    looking_for: "High UDP packet rate to amplification ports (53, 123, 1900, 11211) and ≥ 4 distinct source IPs in a 10s window.",
    protocol: "UDP",
  },
  slowloris: {
    behavior: "Slow HTTP exhaustion — attacker opens many HTTP connections and keeps them open, gradually draining the server's connection pool.",
    looking_for: "≥ 8 incomplete TCP connections to HTTP ports with very low bytes-per-connection and connection rate ≤ 1/s.",
    protocol: "TCP/HTTP",
  },
};

const humanThreat = (value: string) =>
  SCENARIO_DISPLAY_NAMES[value] ||
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));

export function AttackReplayPanel({
  scenario,
  status,
  flows,
  latestAlert,
  metrics,
}: AttackReplayPanelProps) {
  const isRunning = status === "running";
  const isBackendComplete = status === "completed";
  const hasFlows = flows.length > 0;
  const latestFlow = flows[0] || null;

  // Determine the overall pipeline state label
  const pipelineState: "waiting" | "observing" | "analyzing" | "detected" = latestAlert
    ? "detected"
    : isBackendComplete
    ? (hasFlows ? "analyzing" : "waiting")
    : hasFlows
    ? "analyzing"
    : isRunning
    ? "observing"
    : "waiting";

  // Map alert evidence into a quick lookup dictionary
  const evidenceMap = useMemo(() => {
    if (!latestAlert) return new Map<string, string | number | boolean | number[]>();
    const map = new Map<string, string | number | boolean | number[]>();
    latestAlert.evidence.forEach((item) => {
      map.set(item.feature, item.value);
    });
    return map;
  }, [latestAlert]);

  // Map evidence reasons into lookup
  const evidenceReasonMap = useMemo(() => {
    if (!latestAlert) return new Map<string, string>();
    const map = new Map<string, string>();
    latestAlert.evidence.forEach((item) => {
      map.set(item.feature, item.reason);
    });
    return map;
  }, [latestAlert]);

  // Real-time calculation of window metrics from actual replayed flows buffer
  const calculatedMetrics = useMemo(() => {
    if (!hasFlows) return {};

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

  // Scenario-Aware Feature Evaluation & Threshold Mapping
  // IMPORTANT: triggered is ONLY true when evidenceMap has data from a real alert
  //            or when the computed metric genuinely crosses the threshold.
  //            We NEVER set triggered=true just because latestAlert exists.
  const scenarioFeatures = useMemo<FeatureCondition[]>(() => {
    const s = (scenario || latestAlert?.threat_class || "").toLowerCase();
    const hasEvidence = Boolean(latestAlert);

    if (s.includes("syn") || s.includes("ddos")) {
      const pps = (evidenceMap.get("packets_per_second") ?? calculatedMetrics.packetsPerSec ?? 0) as number;
      const sr = (evidenceMap.get("syn_ratio") ?? calculatedMetrics.synRatio ?? 0) as number;
      const ir = (evidenceMap.get("incomplete_ratio") ?? calculatedMetrics.incompleteRatio ?? 0) as number;
      const se = (evidenceMap.get("source_entropy") ?? 0) as number;

      return [
        {
          label: "Packets Per Second",
          featureKey: "packets_per_second",
          currentValue: pps,
          threshold: "≥ 1000.0",
          triggered: hasEvidence ? evidenceMap.has("packets_per_second") : pps >= 1000,
          reason: evidenceReasonMap.get("packets_per_second"),
          unit: "pkts/s",
        },
        {
          label: "SYN Flag Ratio",
          featureKey: "syn_ratio",
          currentValue: sr,
          threshold: "≥ 0.80",
          triggered: hasEvidence ? evidenceMap.has("syn_ratio") : sr >= 0.8,
          reason: evidenceReasonMap.get("syn_ratio"),
        },
        {
          label: "Incomplete Ratio",
          featureKey: "incomplete_ratio",
          currentValue: ir,
          threshold: "≥ 0.80",
          triggered: hasEvidence ? evidenceMap.has("incomplete_ratio") : ir >= 0.8,
          reason: evidenceReasonMap.get("incomplete_ratio"),
        },
        {
          label: "Source Entropy",
          featureKey: "source_entropy",
          currentValue: se,
          threshold: "Passive Window",
          triggered: hasEvidence ? evidenceMap.has("source_entropy") : false,
          reason: evidenceReasonMap.get("source_entropy"),
        },
      ];
    }

    if (s.includes("port_scan")) {
      const ports = (evidenceMap.get("unique_destination_ports") ?? calculatedMetrics.uniquePorts ?? 0) as number;
      const hosts = (evidenceMap.get("unique_destination_hosts") ?? calculatedMetrics.uniqueHosts ?? 0) as number;

      return [
        {
          label: "Unique Target Ports",
          featureKey: "unique_destination_ports",
          currentValue: ports,
          threshold: "≥ 20",
          triggered: hasEvidence ? evidenceMap.has("unique_destination_ports") : ports >= 20,
          reason: evidenceReasonMap.get("unique_destination_ports"),
          unit: "ports",
        },
        {
          label: "Unique Target Hosts",
          featureKey: "unique_destination_hosts",
          currentValue: hosts,
          threshold: "Passive Fan-out",
          triggered: hasEvidence ? evidenceMap.has("unique_destination_hosts") : false,
          reason: evidenceReasonMap.get("unique_destination_hosts"),
          unit: "hosts",
        },
      ];
    }

    if (s.includes("dns_tunnel")) {
      const entropy = (evidenceMap.get("query_entropy") ?? 0) as number;
      const avgLen = (evidenceMap.get("average_query_length") ?? calculatedMetrics.avgQueryLen ?? 0) as number;
      const uRatio = (evidenceMap.get("unique_query_ratio") ?? calculatedMetrics.uniqueDnsRatio ?? 0) as number;

      return [
        {
          label: "DNS Label Entropy",
          featureKey: "query_entropy",
          currentValue: entropy,
          threshold: "≥ 3.50",
          triggered: hasEvidence ? evidenceMap.has("query_entropy") : entropy >= 3.5,
          reason: evidenceReasonMap.get("query_entropy"),
          unit: "bits",
        },
        {
          label: "Avg Query Length",
          featureKey: "average_query_length",
          currentValue: avgLen,
          threshold: "≥ 30",
          triggered: hasEvidence ? evidenceMap.has("average_query_length") : avgLen >= 30,
          reason: evidenceReasonMap.get("average_query_length"),
          unit: "chars",
        },
        {
          label: "Unique Query Ratio",
          featureKey: "unique_query_ratio",
          currentValue: uRatio,
          threshold: "≥ 0.75",
          triggered: hasEvidence ? evidenceMap.has("unique_query_ratio") : uRatio >= 0.75,
          reason: evidenceReasonMap.get("unique_query_ratio"),
        },
      ];
    }

    if (s.includes("dga")) {
      const dgaScore = (evidenceMap.get("dga_lexical_score") ?? 0) as number;
      const uRatio = (evidenceMap.get("unique_query_ratio") ?? calculatedMetrics.uniqueDnsRatio ?? 0) as number;
      const qCount = (evidenceMap.get("dga_query_count") ?? flows.length ?? 0) as number;

      return [
        {
          label: "DGA Lexical Score",
          featureKey: "dga_lexical_score",
          currentValue: dgaScore,
          threshold: "≥ 0.68",
          triggered: hasEvidence ? evidenceMap.has("dga_lexical_score") : dgaScore >= 0.68,
          reason: evidenceReasonMap.get("dga_lexical_score"),
        },
        {
          label: "Unique Domain Ratio",
          featureKey: "unique_query_ratio",
          currentValue: uRatio,
          threshold: "≥ 0.80",
          triggered: hasEvidence ? evidenceMap.has("unique_query_ratio") : uRatio >= 0.8,
          reason: evidenceReasonMap.get("unique_query_ratio"),
        },
        {
          label: "Suspicious Query Count",
          featureKey: "dga_query_count",
          currentValue: qCount,
          threshold: "≥ 6",
          triggered: hasEvidence ? evidenceMap.has("dga_query_count") : qCount >= 6,
          reason: evidenceReasonMap.get("dga_query_count"),
          unit: "queries",
        },
      ];
    }

    if (s.includes("beacon")) {
      const pScore = (evidenceMap.get("periodicity_score") ?? 0) as number;
      const target = (evidenceMap.get("recurring_destination") ?? latestFlow?.destination_ip ?? "—") as string;
      const count = (evidenceMap.get("beacon_event_count") ?? flows.length ?? 0) as number;

      return [
        {
          label: "Periodicity Score",
          featureKey: "periodicity_score",
          currentValue: pScore,
          threshold: "≥ 0.85",
          triggered: hasEvidence ? evidenceMap.has("periodicity_score") : pScore >= 0.85,
          reason: evidenceReasonMap.get("periodicity_score"),
        },
        {
          label: "Recurring Destination",
          featureKey: "recurring_destination",
          currentValue: target,
          threshold: "Repeated Contact",
          triggered: hasEvidence ? evidenceMap.has("recurring_destination") : false,
          reason: evidenceReasonMap.get("recurring_destination"),
        },
        {
          label: "Beacon Flow Count",
          featureKey: "beacon_event_count",
          currentValue: count,
          threshold: "≥ 5",
          triggered: hasEvidence ? evidenceMap.has("beacon_event_count") : count >= 5,
          reason: evidenceReasonMap.get("beacon_event_count"),
          unit: "events",
        },
      ];
    }

    if (s.includes("encrypted")) {
      const score = (evidenceMap.get("tls_metadata_score") ?? 0) as number;
      const fp = (evidenceMap.get("tls_fingerprint") ?? latestFlow?.tls_fingerprint ?? "—") as string;

      return [
        {
          label: "TLS Metadata Score",
          featureKey: "tls_metadata_score",
          currentValue: score,
          threshold: "≥ 0.70",
          triggered: hasEvidence ? evidenceMap.has("tls_metadata_score") : score >= 0.7,
          reason: evidenceReasonMap.get("tls_metadata_score"),
        },
        {
          label: "TLS Fingerprint",
          featureKey: "tls_fingerprint",
          currentValue: fp,
          threshold: "Passive Metadata",
          triggered: hasEvidence ? evidenceMap.has("tls_fingerprint") : false,
          reason: evidenceReasonMap.get("tls_fingerprint"),
        },
      ];
    }

    if (s.includes("exfil")) {
      const bytes = (evidenceMap.get("outbound_bytes") ?? calculatedMetrics.outboundBytes ?? 0) as number;
      const ratio = (evidenceMap.get("outbound_inbound_ratio") ?? calculatedMetrics.outboundRatio ?? 0) as number;

      return [
        {
          label: "Outbound Bytes",
          featureKey: "outbound_bytes",
          currentValue: bytes.toLocaleString(),
          threshold: "≥ 100,000",
          triggered: hasEvidence ? evidenceMap.has("outbound_bytes") : bytes >= 100000,
          reason: evidenceReasonMap.get("outbound_bytes"),
          unit: "B",
        },
        {
          label: "Outbound / Inbound Ratio",
          featureKey: "outbound_inbound_ratio",
          currentValue: ratio,
          threshold: "≥ 10.0",
          triggered: hasEvidence ? evidenceMap.has("outbound_inbound_ratio") : ratio >= 10.0,
          reason: evidenceReasonMap.get("outbound_inbound_ratio"),
        },
      ];
    }

    if (s.includes("udp_amp")) {
      const pps = (evidenceMap.get("udp_packets_per_second") ?? calculatedMetrics.packetsPerSec ?? 0) as number;
      const sources = (evidenceMap.get("distinct_sources") ?? calculatedMetrics.uniqueHosts ?? 0) as number;

      return [
        {
          label: "UDP Packets Per Second",
          featureKey: "udp_packets_per_second",
          currentValue: pps,
          threshold: "≥ 50.0",
          triggered: hasEvidence ? evidenceMap.has("udp_packets_per_second") : pps >= 50,
          reason: evidenceReasonMap.get("udp_packets_per_second"),
          unit: "pkts/s",
        },
        {
          label: "Distinct Source IPs",
          featureKey: "distinct_sources",
          currentValue: sources,
          threshold: "≥ 4",
          triggered: hasEvidence ? evidenceMap.has("distinct_sources") : sources >= 4,
          reason: evidenceReasonMap.get("distinct_sources"),
          unit: "IPs",
        },
      ];
    }

    if (s.includes("slowloris")) {
      const openConns = (evidenceMap.get("held_open_connections") ?? flows.length ?? 0) as number;
      const avgB = (evidenceMap.get("average_bytes_per_connection") ?? 0) as number;
      const connRate = (evidenceMap.get("connection_rate_per_second") ?? 0) as number;

      return [
        {
          label: "Held Open Connections",
          featureKey: "held_open_connections",
          currentValue: openConns,
          threshold: "≥ 8",
          triggered: hasEvidence ? evidenceMap.has("held_open_connections") : openConns >= 8,
          reason: evidenceReasonMap.get("held_open_connections"),
          unit: "conns",
        },
        {
          label: "Avg Bytes / Connection",
          featureKey: "average_bytes_per_connection",
          currentValue: avgB,
          threshold: "≤ 2000",
          triggered: hasEvidence ? evidenceMap.has("average_bytes_per_connection") : false,
          reason: evidenceReasonMap.get("average_bytes_per_connection"),
          unit: "B",
        },
        {
          label: "Connection Rate",
          featureKey: "connection_rate_per_second",
          currentValue: connRate,
          threshold: "≤ 1.0",
          triggered: hasEvidence ? evidenceMap.has("connection_rate_per_second") : false,
          reason: evidenceReasonMap.get("connection_rate_per_second"),
          unit: "conn/s",
        },
      ];
    }

    // Default fallback
    return [
      {
        label: "Observed Packets",
        featureKey: "packets",
        currentValue: calculatedMetrics.packetsPerSec || 0,
        threshold: "Passive Inspection",
        triggered: false,
        unit: "pkts/s",
      },
      {
        label: "Window Bytes",
        featureKey: "bytes",
        currentValue: (calculatedMetrics.totalBytes || 0).toLocaleString(),
        threshold: "Passive Inspection",
        triggered: false,
        unit: "B",
      },
    ];
  }, [scenario, latestAlert, evidenceMap, evidenceReasonMap, calculatedMetrics, flows, latestFlow]);

  // Extract ML evidence when present in alert
  const mlPrediction = evidenceMap.get("ml_prediction") as string | undefined;
  const mlAnomalyScore = evidenceMap.get("ml_anomaly_score") as number | undefined;

  const scenarioInfo = SCENARIO_DESCRIPTIONS[scenario] || null;

  // State progression label map
  const stateLabel = {
    waiting: "WAITING FOR REPLAY",
    observing: "OBSERVING TRAFFIC",
    analyzing: "ANALYZING TELEMETRY",
    detected: "THREAT DETECTED",
  }[pipelineState];

  const stateColor = {
    waiting: "var(--color-stone)",
    observing: "var(--color-mint)",
    analyzing: "var(--color-caribbean-green)",
    detected: "var(--severity-critical)",
  }[pipelineState];

  return (
    <section className="attack-replay-container">
      {/* LEFT SIDE: ATTACK ACTIVITY */}
      <div className="attack-activity-panel">
        <div className="panel-sub-header">
          <div className="title-lockup">
            <span className="panel-kicker">LIVE REPLAY TELEMETRY</span>
            <h2 className="panel-title">Attack Activity</h2>
          </div>
          <div className="replay-state-badge" style={{ color: stateColor }}>
            <span className="replay-state-dot" style={{ background: stateColor }} />
            <span className="mono-text" style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em" }}>
              {stateLabel}
            </span>
          </div>
        </div>

        {/* SCENARIO CONTEXT BLOCK — only when flows haven't come in yet or scenario is selected */}
        {scenarioInfo && !hasFlows && (
          <div className="scenario-context-block">
            <div className="scenario-context-header">
              <ShieldAlert size={14} style={{ color: "var(--color-caribbean-green)", flexShrink: 0 }} />
              <span className="scenario-context-title">
                {humanThreat(scenario)} · <span style={{ color: "var(--color-stone)", fontWeight: 400 }}>{scenarioInfo.protocol}</span>
              </span>
            </div>
            <div className="scenario-context-row">
              <span className="scenario-context-label">BEHAVIOR</span>
              <span className="scenario-context-text">{scenarioInfo.behavior}</span>
            </div>
            <div className="scenario-context-row">
              <span className="scenario-context-label">DETECTION TARGET</span>
              <span className="scenario-context-text" style={{ color: "var(--color-caribbean-green)" }}>
                {scenarioInfo.looking_for}
              </span>
            </div>
          </div>
        )}

        {!hasFlows ? (
          <div className="replay-idle-state">
            <Radio className="idle-icon" size={32} />
            <div className="idle-title">
              {isRunning ? "AWAITING FIRST FLOW EVENT..." : "WAITING FOR REPLAY"}
            </div>
            <div className="idle-desc">
              {isRunning
                ? "Backend is replaying scenario. Flow events will appear here when received via WebSocket."
                : "Select a threat scenario above and press Start Replay to observe live attack traffic and run detection analysis."}
            </div>
          </div>
        ) : (
          <div className="attack-telemetry-content">
            {/* SCENARIO MINI BANNER when flows are live */}
            {scenarioInfo && (
              <div className="scenario-live-banner">
                <Eye size={12} style={{ color: "var(--color-caribbean-green)", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "var(--color-stone)" }}>
                  <span style={{ color: "var(--color-caribbean-green)", fontWeight: 700 }}>
                    {humanThreat(scenario)}
                  </span>
                  {" "}— {scenarioInfo.looking_for}
                </span>
              </div>
            )}

            {/* LATEST OBSERVED FLOW SOCKET VECTOR */}
            {latestFlow && (
              <div className="active-socket-card">
                <div className="socket-node">
                  <span className="socket-label">SOURCE SOCKET</span>
                  <span className="socket-ip ip-address">
                    {latestFlow.source_ip}:{latestFlow.source_port}
                  </span>
                </div>

                <div className="socket-vector">
                  <div className="vector-meta">
                    <span>{latestFlow.protocol}</span>
                    <span>·</span>
                    <span>{latestFlow.packets} pkts</span>
                    <span>·</span>
                    <span>{latestFlow.bytes} B</span>
                  </div>
                  <div className="vector-arrow-line">
                    <div className="vector-pulse-dot" />
                    <ArrowRight size={16} />
                  </div>
                  <span className="vector-direction">{latestFlow.direction?.toUpperCase() || "PASSIVE"}</span>
                </div>

                <div className="socket-node" style={{ alignItems: "flex-end" }}>
                  <span className="socket-label">DESTINATION SOCKET</span>
                  <span className="socket-ip ip-address">
                    {latestFlow.destination_ip}:{latestFlow.destination_port}
                  </span>
                </div>
              </div>
            )}

            {/* PASSIVE METADATA BADGES */}
            {latestFlow && (latestFlow.dns_query || latestFlow.tls_fingerprint || latestFlow.tcp_flags?.length) && (
              <div className="metadata-badges-strip">
                {latestFlow.dns_query && (
                  <div className="meta-pill">
                    <Eye size={12} />
                    <span>DNS: {latestFlow.dns_query.slice(0, 30)}{latestFlow.dns_query.length > 30 ? "…" : ""} ({latestFlow.dns_record_type || "A"})</span>
                  </div>
                )}
                {latestFlow.tls_fingerprint && (
                  <div className="meta-pill">
                    <Lock size={12} />
                    <span>TLS: {latestFlow.tls_version || "Handshake"} · {latestFlow.tls_fingerprint.slice(0, 12)}…</span>
                  </div>
                )}
                {latestFlow.tcp_flags && latestFlow.tcp_flags.length > 0 && (
                  <div className="meta-pill">
                    <Zap size={12} />
                    <span>FLAGS: {latestFlow.tcp_flags.join(", ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* BOUNDED STREAM TABLE OF OBSERVED FLOWS */}
            <div className="flow-stream-wrapper">
              <div className="flow-stream-header">
                <span>TIMESTAMP</span>
                <span>FLOW ID</span>
                <span>VECTOR (SRC → DST)</span>
                <span>PROTO</span>
                <span>VOL</span>
              </div>
              <div className="flow-stream-list">
                {flows.map((flow) => (
                  <div className="flow-stream-row" key={`${flow.flow_id}-${flow.timestamp}`}>
                    <span className="timestamp">{formatTime(flow.timestamp)}</span>
                    <span className="mono-text" style={{ color: "var(--color-caribbean-green)" }}>
                      {flow.flow_id}
                    </span>
                    <span className="mono-text" style={{ fontSize: "11px" }}>
                      {flow.source_ip}:{flow.source_port} → {flow.destination_ip}:{flow.destination_port}
                    </span>
                    <span className="mono-text">{flow.protocol}</span>
                    <span className="mono-text" style={{ color: "var(--color-stone)" }}>
                      {flow.packets}p / {flow.bytes}B
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* POST-DETECTION FLOW CHAIN */}
            {latestAlert && (
              <div className="detection-chain-callout">
                <div className="chain-step">
                  <CheckCircle2 size={12} style={{ color: "var(--color-caribbean-green)" }} />
                  <span>Flow observed</span>
                </div>
                <ChevronRight size={10} style={{ color: "var(--color-stone)" }} />
                <div className="chain-step">
                  <CheckCircle2 size={12} style={{ color: "var(--color-caribbean-green)" }} />
                  <span>Features extracted</span>
                </div>
                <ChevronRight size={10} style={{ color: "var(--color-stone)" }} />
                <div className="chain-step">
                  <CheckCircle2 size={12} style={{ color: "var(--color-caribbean-green)" }} />
                  <span>Rule satisfied</span>
                </div>
                <ChevronRight size={10} style={{ color: "var(--color-stone)" }} />
                <div className="chain-step">
                  <CheckCircle2 size={12} style={{ color: mlPrediction ? "var(--color-caribbean-green)" : "var(--color-stone)" }} />
                  <span style={{ color: mlPrediction ? "inherit" : "var(--color-stone)" }}>ML enriched</span>
                </div>
                <ChevronRight size={10} style={{ color: "var(--color-stone)" }} />
                <div className="chain-step chain-step-alert">
                  <AlertTriangle size={12} style={{ color: "var(--severity-critical)" }} />
                  <span style={{ color: "var(--severity-critical)", fontWeight: 700 }}>Alert generated</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT SIDE: DETECTION ANALYSIS */}
      <div className="detection-analysis-panel">
        <div className="panel-sub-header">
          <div className="title-lockup">
            <span className="panel-kicker">PIPELINE REASONING ENGINE</span>
            <h2 className="panel-title">Detection Analysis</h2>
          </div>
          <div className="scenario-tag-badge">
            <ShieldAlert size={14} />
            <span>{scenario ? humanThreat(scenario) : "SCENARIO REASONING"}</span>
          </div>
        </div>

        {/* PIPELINE STAGES VISUALIZER with state progression */}
        <div className="pipeline-stages-bar">
          <div className={`stage-step ${pipelineState === "waiting" ? "" : "active"}`}>
            <Layers size={13} />
            <span>FLOWS</span>
          </div>
          <div className="stage-divider">→</div>
          <div className={`stage-step ${hasFlows ? "active" : ""}`}>
            <Activity size={13} />
            <span>FEATURES</span>
          </div>
          <div className="stage-divider">→</div>
          <div className={`stage-step ${latestAlert ? "triggered" : hasFlows ? "active" : ""}`}>
            <ShieldCheck size={13} />
            <span>RULES</span>
          </div>
          <div className="stage-divider">→</div>
          <div className={`stage-step ${latestAlert && mlPrediction ? "triggered" : metrics.model_status?.available ? "active" : ""}`}>
            <Cpu size={13} />
            <span>ML</span>
          </div>
          <div className="stage-divider">→</div>
          <div className={`stage-step ${latestAlert ? "triggered" : ""}`}>
            <CheckCircle2 size={13} />
            <span>DECISION</span>
          </div>
        </div>

        {/* PIPELINE STATE PROGRESS ANNOTATION */}
        <div className="pipeline-state-annotation">
          <div
            className="pipeline-state-chip"
            style={{
              background: pipelineState === "detected"
                ? "rgba(239, 68, 68, 0.12)"
                : pipelineState === "analyzing"
                ? "rgba(0, 208, 132, 0.10)"
                : "rgba(124, 135, 133, 0.1)",
              borderColor: pipelineState === "detected"
                ? "rgba(239, 68, 68, 0.4)"
                : pipelineState === "analyzing"
                ? "rgba(0, 208, 132, 0.3)"
                : "var(--color-muted-border)",
              color: stateColor,
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em" }}>
              {pipelineState === "waiting" && "AWAITING TRAFFIC — START REPLAY TO BEGIN"}
              {pipelineState === "observing" && "OBSERVING — ACCUMULATING FLOW WINDOW..."}
              {pipelineState === "analyzing" && (isBackendComplete ? "ANALYSIS COMPLETED — TELEMETRY PROCESSED" : "ANALYZING — EVALUATING RULES AGAINST FEATURES...")}
              {pipelineState === "detected" && `RULE FIRED → ${latestAlert?.detector.toUpperCase()} TRIGGERED`}
            </span>
          </div>
        </div>

        {/* FEATURE EXTRACTION & RULE EVALUATION */}
        <div className="analysis-section-title">
          <span className="section-kicker">RULE EVALUATION &amp; THRESHOLDS</span>
        </div>

        <div className="feature-conditions-list">
          {scenarioFeatures.map((feat) => (
            <div className={`feature-cond-card ${feat.triggered ? "triggered" : ""}`} key={feat.featureKey}>
              <div className="cond-top">
                <span className="cond-label">{feat.label}</span>
                <span className={`cond-status-badge ${feat.triggered ? "triggered" : "normal"}`}>
                  {feat.triggered ? "● TRIGGERED" : hasFlows ? "EVALUATING" : "WAITING"}
                </span>
              </div>
              <div className="cond-values">
                <div className="cond-val-group">
                  <span className="val-lbl">OBSERVED VALUE</span>
                  <span className="val-num mono-text">
                    {typeof feat.currentValue === "number"
                      ? feat.currentValue.toLocaleString()
                      : feat.currentValue}{" "}
                    {feat.unit || ""}
                  </span>
                </div>
                <div className="cond-threshold-separator">
                  <ArrowDown size={10} style={{ color: "var(--color-stone)" }} />
                </div>
                <div className="cond-val-group" style={{ textAlign: "right" }}>
                  <span className="val-lbl">DETECTOR THRESHOLD</span>
                  <span className={`val-thresh mono-text ${feat.triggered ? "threshold-triggered" : ""}`}>
                    {feat.threshold}
                  </span>
                </div>
              </div>
              {/* Show actual reason from alert evidence when available */}
              {feat.reason && feat.triggered && (
                <div className="cond-reason-text">{feat.reason}</div>
              )}
            </div>
          ))}
        </div>

        {/* ML TRANSPARENCY ENRICHMENT */}
        <div className="analysis-section-title" style={{ marginTop: "12px" }}>
          <span className="section-kicker">ML ENRICHMENT LAYER</span>
        </div>

        <div className="ml-transparency-card">
          <div className="ml-row">
            <span className="ml-lbl">MODEL VERSION</span>
            <span className="ml-val mono-text">
              {latestAlert?.model_version || (metrics.model_status?.available ? metrics.model_status.version : "rules-only")}
            </span>
          </div>
          <div className="ml-row">
            <span className="ml-lbl">ML PREDICTION</span>
            <span
              className="ml-val mono-text"
              style={{ color: mlPrediction ? "var(--color-caribbean-green)" : "var(--color-stone)" }}
            >
              {mlPrediction
                ? humanThreat(mlPrediction)
                : metrics.model_status?.available
                ? hasFlows ? "Scoring window..." : "Awaiting flows"
                : "Rules Authoritative"}
            </span>
          </div>
          <div className="ml-row">
            <span className="ml-lbl">ANOMALY SCORE</span>
            <span className="ml-val mono-text">
              {mlAnomalyScore !== undefined ? mlAnomalyScore.toFixed(4) : "0.0000 (Benign Baseline)"}
            </span>
          </div>
          <div className="ml-disclaimer">
            Deterministic rules are authoritative. ML provides supplemental window scoring only.
          </div>
        </div>

        {/* FINAL DECISION CARD */}
        <div className="analysis-section-title" style={{ marginTop: "12px" }}>
          <span className="section-kicker">FINAL DECISION</span>
        </div>

        <div className={`final-decision-card ${latestAlert ? "threat-confirmed" : ""}`}>
          {latestAlert ? (
            <>
              <div className="decision-header">
                <ShieldAlert size={20} className="decision-alert-icon" />
                <div className="decision-titles">
                  <span className="decision-kicker">THREAT CONFIRMED</span>
                  <h3 className="decision-threat-name">{humanThreat(latestAlert.threat_class)}</h3>
                </div>
                <span className={`badge-soc ${latestAlert.severity}`} style={{ marginLeft: "auto" }}>
                  {latestAlert.severity}
                </span>
              </div>

              <div className="decision-metrics-grid">
                <div className="dec-item">
                  <span className="dec-lbl">CONFIDENCE</span>
                  <span className="dec-val mono-text" style={{ color: "var(--color-caribbean-green)" }}>
                    {Math.round(latestAlert.confidence * 100)}%
                  </span>
                </div>
                <div className="dec-item">
                  <span className="dec-lbl">DETECTOR</span>
                  <span className="dec-val mono-text">{latestAlert.detector}</span>
                </div>
                <div className="dec-item">
                  <span className="dec-lbl">EVIDENCE ITEMS</span>
                  <span className="dec-val mono-text">{latestAlert.evidence.length}</span>
                </div>
              </div>

              {/* POST-DETECTION INCIDENT LINK */}
              <div className="decision-incident-link">
                <ChevronRight size={12} style={{ color: "var(--color-caribbean-green)" }} />
                <span>
                  Alert dispatched to{" "}
                  <span style={{ color: "var(--color-caribbean-green)", fontWeight: 700 }}>
                    Incident Stream
                  </span>
                  {" "}↓ — click any row in the table below to investigate.
                </span>
              </div>
            </>
          ) : (
            <div className="decision-pending">
              <Activity size={18} className="pending-icon" />
              <span>
                {pipelineState === "waiting"
                  ? "Monitoring standby. Start replay to begin detection pipeline."
                  : pipelineState === "observing"
                  ? "Observing traffic. Waiting for window accumulation..."
                  : "Analyzing telemetry. Decision will update when detector rules fire."}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

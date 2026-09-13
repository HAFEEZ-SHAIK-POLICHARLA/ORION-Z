import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Eye,
  Layers,
  Network,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Alert } from "../types";

interface ThreatDef {
  id: string;
  name: string;
  detector: string;
  severity: "critical" | "high" | "medium" | "low";
  protocol: string;
  description: string;
  detectionApproach: string;
  features: { name: string; threshold: string; description: string }[];
  pipeline: string[];
}

const THREAT_CATALOGUE: ThreatDef[] = [
  {
    id: "syn_flood",
    name: "SYN Flood (DDoS)",
    detector: "syn_flood_v1",
    severity: "critical",
    protocol: "TCP",
    description:
      "A volumetric denial-of-service attack that exhausts server TCP state by sending massive numbers of SYN packets without completing the three-way handshake.",
    detectionApproach:
      "Windowed passive flow inspection. All three conditions must fire simultaneously: packet rate, SYN flag ratio, and incomplete connection ratio.",
    features: [
      { name: "packets_per_second", threshold: "≥ 1000.0 pkts/s", description: "Aggregate packet rate in the SYN window" },
      { name: "syn_ratio", threshold: "≥ 0.80", description: "Fraction of flows carrying SYN flags" },
      { name: "incomplete_ratio", threshold: "≥ 0.80", description: "Fraction of connections that never completed handshake" },
      { name: "source_entropy", threshold: "Passive window metric", description: "Diversity of source IPs in the window" },
    ],
    pipeline: ["FLOWS", "SYN FLAG FILTER", "WINDOW RATE CALC", "RULE EVALUATION", "ML ENRICHMENT", "CRITICAL ALERT"],
  },
  {
    id: "port_scanning",
    name: "Port Scanning",
    detector: "port_scan_v1",
    severity: "high",
    protocol: "TCP",
    description:
      "Systematic probing of port ranges on a target host to enumerate open services. Observed passively via flow metadata showing a single source touching many destination ports.",
    detectionApproach:
      "Per-source windowed fan-out analysis. Triggers when a single source IP contacts an excessive number of unique destination ports in the observation window.",
    features: [
      { name: "unique_destination_ports", threshold: "≥ 20 unique ports", description: "Distinct destination ports contacted by one source in window" },
      { name: "unique_destination_hosts", threshold: "Passive fan-out metric", description: "Destination host diversity (lateral movement indicator)" },
    ],
    pipeline: ["FLOWS", "SOURCE GROUPING", "PORT FAN-OUT COUNT", "RULE EVALUATION", "ML ENRICHMENT", "HIGH ALERT"],
  },
  {
    id: "dns_tunnelling",
    name: "DNS Tunnelling",
    detector: "dns_tunnelling_v1",
    severity: "high",
    protocol: "DNS/UDP",
    description:
      "Covert channel exfiltration or C2 communication encoded within DNS query labels. Detected via entropy analysis and query length statistics without payload inspection.",
    detectionApproach:
      "Entropy, length, and uniqueness analysis of DNS query labels in a 30-second window. Requires a minimum of 8 DNS queries before evaluation.",
    features: [
      { name: "query_entropy", threshold: "≥ 3.50 bits", description: "Shannon entropy of DNS label characters" },
      { name: "average_query_length", threshold: "≥ 30 chars", description: "Mean length of DNS query strings" },
      { name: "unique_query_ratio", threshold: "≥ 0.75", description: "Fraction of queries that are unique (not repeated)" },
    ],
    pipeline: ["FLOWS", "DNS QUERY FILTER", "ENTROPY COMPUTATION", "RULE EVALUATION", "ML ENRICHMENT", "HIGH ALERT"],
  },
  {
    id: "dga",
    name: "DGA (Domain Generation Algorithm)",
    detector: "dga_v1",
    severity: "high",
    protocol: "DNS/UDP",
    description:
      "Malware uses algorithmically generated domain names to locate C2 servers, making static blocklists ineffective. Detected by lexical scoring of domain labels.",
    detectionApproach:
      "Lexical domain scoring using character n-gram analysis. Requires at least 6 non-TXT DNS queries. Triggers when average DGA score and unique ratio both exceed thresholds.",
    features: [
      { name: "dga_lexical_score", threshold: "≥ 0.68", description: "Probability that label was algorithmically generated" },
      { name: "unique_query_ratio", threshold: "≥ 0.80", description: "Most queried domains are unique (no repetition)" },
      { name: "dga_query_count", threshold: "≥ 6 queries", description: "Minimum suspicious query count before evaluation" },
    ],
    pipeline: ["FLOWS", "DNS (non-TXT) FILTER", "LEXICAL SCORING", "RULE EVALUATION", "ML ENRICHMENT", "HIGH ALERT"],
  },
  {
    id: "beaconing",
    name: "Botnet Beaconing",
    detector: "beaconing_v1",
    severity: "high",
    protocol: "TCP/UDP",
    description:
      "Infected hosts periodically check in with C2 infrastructure at predictable intervals. The periodic regularity is the detection signal, not content.",
    detectionApproach:
      "Periodicity scoring over a 30-second window of completed connections to the same destination. Requires at least 5 beacon events.",
    features: [
      { name: "periodicity_score", threshold: "≥ 0.85", description: "Regularity of inter-arrival times (0=random, 1=perfect clock)" },
      { name: "recurring_destination", threshold: "Repeated contact pattern", description: "Same destination contacted repeatedly" },
      { name: "beacon_event_count", threshold: "≥ 5 events", description: "Minimum completed connection count in window" },
    ],
    pipeline: ["FLOWS", "PAIR GROUPING", "PERIODICITY SCORING", "RULE EVALUATION", "ML ENRICHMENT", "HIGH ALERT"],
  },
  {
    id: "encrypted_session",
    name: "Encrypted Session Anomaly",
    detector: "encrypted_metadata_v1",
    severity: "medium",
    protocol: "TLS/QUIC",
    description:
      "Detection of anomalous encrypted sessions using TLS handshake metadata and packet-size signatures. Payload is never accessed — only metadata is used.",
    detectionApproach:
      "TLS metadata scoring using fingerprint, version, and packet-size distributions. Single-event evaluation with no window accumulation required.",
    features: [
      { name: "tls_metadata_score", threshold: "≥ 0.70", description: "Composite TLS/QUIC metadata anomaly score" },
      { name: "tls_fingerprint", threshold: "Passive handshake metadata", description: "JA3-style fingerprint from handshake" },
      { name: "packet_size_signature", threshold: "Passive size metadata", description: "Packet-size distribution without payload access" },
    ],
    pipeline: ["FLOWS", "TLS METADATA EXTRACT", "FINGERPRINT SCORING", "RULE EVALUATION", "ML ENRICHMENT", "MEDIUM ALERT"],
  },
  {
    id: "exfiltration",
    name: "Data Exfiltration",
    detector: "exfiltration_v1",
    severity: "high",
    protocol: "TCP/UDP",
    description:
      "Large asymmetric outbound data transfer indicating unauthorized data exfiltration. Detected via per-source byte volume and directional ratio analysis.",
    detectionApproach:
      "Per-source 30-second window outbound byte accumulation with inbound/outbound ratio analysis. Both byte volume and ratio thresholds must be exceeded.",
    features: [
      { name: "outbound_bytes", threshold: "≥ 100,000 bytes", description: "Cumulative outbound bytes from source in window" },
      { name: "outbound_inbound_ratio", threshold: "≥ 10.0", description: "Ratio of outbound to inbound bytes (asymmetry)" },
      { name: "source_window_events", threshold: "Window accumulation", description: "Flow count contributing to volume calculation" },
    ],
    pipeline: ["FLOWS", "DIRECTION FILTER", "BYTE ACCUMULATION", "RULE EVALUATION", "ML ENRICHMENT", "HIGH ALERT"],
  },
  {
    id: "udp_amplification",
    name: "UDP Amplification",
    detector: "udp_amplification_v1",
    severity: "high",
    protocol: "UDP",
    description:
      "Reflected amplification DDoS attack using UDP services (DNS port 53, NTP port 123, SSDP port 1900, Memcached port 11211) with spoofed source IPs.",
    detectionApproach:
      "10-second window tracking UDP flows to known amplification-prone ports. Triggers when packet rate and distinct source count both exceed thresholds.",
    features: [
      { name: "udp_packets_per_second", threshold: "≥ 50.0 pkts/s", description: "UDP packet rate to amplification ports" },
      { name: "distinct_sources", threshold: "≥ 4 source IPs", description: "Distinct source IPs (spoofing indicator)" },
      { name: "amplification_ports", threshold: "Ports 53, 123, 1900, 11211", description: "DNS/NTP/SSDP/Memcached port targeting" },
    ],
    pipeline: ["FLOWS", "UDP AMP-PORT FILTER", "RATE + SOURCE COUNT", "RULE EVALUATION", "ML ENRICHMENT", "HIGH ALERT"],
  },
  {
    id: "slowloris",
    name: "Slowloris HTTP Exhaustion",
    detector: "slowloris_v1",
    severity: "medium",
    protocol: "TCP/HTTP",
    description:
      "Slow HTTP denial-of-service attack: keeps many connections open to web server ports without completing them, gradually exhausting connection pool.",
    detectionApproach:
      "Per-source 30-second window tracking TCP connections to HTTP ports (80, 443, 8080) that never complete. Distinguishes from floods via low connection rate.",
    features: [
      { name: "held_open_connections", threshold: "≥ 8 connections", description: "Incomplete TCP connections to HTTP ports" },
      { name: "average_bytes_per_connection", threshold: "≤ 2000 bytes", description: "Very low data volume per connection" },
      { name: "connection_rate_per_second", threshold: "≤ 1.0 conn/s", description: "Low arrival rate (distinguishes from SYN flood)" },
    ],
    pipeline: ["FLOWS", "HTTP PORT FILTER", "CONNECTION TRACKING", "RULE EVALUATION", "ML ENRICHMENT", "MEDIUM ALERT"],
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--severity-critical)",
  high: "var(--severity-high)",
  medium: "var(--severity-medium)",
  low: "var(--severity-low)",
};

const THREAT_ICONS: Record<string, React.ReactNode> = {
  syn_flood: <Zap size={20} />,
  port_scanning: <Network size={20} />,
  dns_tunnelling: <Radio size={20} />,
  dga: <Cpu size={20} />,
  beaconing: <Activity size={20} />,
  encrypted_session: <Shield size={20} />,
  exfiltration: <ArrowRight size={20} />,
  udp_amplification: <AlertTriangle size={20} />,
  slowloris: <Layers size={20} />,
};

interface ThreatsViewProps {
  alerts: Alert[];
}

export function ThreatsView({ alerts }: ThreatsViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const alertsByClass = alerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.threat_class] = (acc[a.threat_class] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="view-container">
      <div className="view-header">
        <div className="view-header-left">
          <span className="view-kicker">THREAT INTELLIGENCE</span>
          <h2 className="view-title">Threat Catalogue</h2>
          <p className="view-subtitle">
            9 active threat detection profiles · Deterministic rule engine + ML enrichment · Passive metadata only
          </p>
        </div>
        <div className="view-header-right">
          <div className="status-pill active">
            <span className="status-dot green" />
            <span>{THREAT_CATALOGUE.length} PROFILES ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="threat-catalogue-grid">
        {THREAT_CATALOGUE.map((threat) => {
          const isExpanded = expanded === threat.id;
          const detectionCount = alertsByClass[threat.id] ?? 0;
          const severityColor = SEVERITY_COLORS[threat.severity];

          return (
            <div
              key={threat.id}
              className={`threat-cat-card ${isExpanded ? "expanded" : ""}`}
              style={{ "--sev-color": severityColor } as React.CSSProperties}
            >
              {/* CARD HEADER */}
              <div
                className="threat-cat-card-header"
                onClick={() => setExpanded(isExpanded ? null : threat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setExpanded(isExpanded ? null : threat.id)}
              >
                <div className="threat-cat-icon" style={{ color: severityColor }}>
                  {THREAT_ICONS[threat.id] ?? <ShieldAlert size={20} />}
                </div>
                <div className="threat-cat-identity">
                  <div className="threat-cat-name">{threat.name}</div>
                  <div className="threat-cat-meta">
                    <span className="mono-text" style={{ fontSize: "10px", color: "var(--color-stone)" }}>
                      {threat.detector}
                    </span>
                    <span className="threat-cat-proto">{threat.protocol}</span>
                  </div>
                </div>
                <div className="threat-cat-right">
                  <span className={`badge-soc ${threat.severity}`}>{threat.severity}</span>
                  {detectionCount > 0 && (
                    <span className="threat-cat-live-count">
                      <span className="status-dot green" style={{ width: "6px", height: "6px" }} />
                      {detectionCount} detected
                    </span>
                  )}
                  <span className="threat-cat-expand-icon" style={{ color: "var(--color-stone)" }}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {/* COLLAPSED SUMMARY */}
              {!isExpanded && (
                <div className="threat-cat-summary">{threat.description}</div>
              )}

              {/* EXPANDED DETAIL */}
              {isExpanded && (
                <div className="threat-cat-detail">
                  <p className="threat-cat-desc">{threat.description}</p>

                  <div className="threat-cat-section-label">DETECTION APPROACH</div>
                  <p className="threat-cat-approach">{threat.detectionApproach}</p>

                  <div className="threat-cat-section-label">EXTRACTED FEATURES & THRESHOLDS</div>
                  <div className="threat-cat-features">
                    {threat.features.map((f) => (
                      <div className="threat-cat-feature-row" key={f.name}>
                        <div className="threat-cat-feature-left">
                          <Eye size={11} style={{ color: "var(--color-caribbean-green)", flexShrink: 0 }} />
                          <div>
                            <span className="threat-cat-feature-name">{f.name.replaceAll("_", " ")}</span>
                            <span className="threat-cat-feature-desc">{f.description}</span>
                          </div>
                        </div>
                        <span className="threat-cat-threshold">{f.threshold}</span>
                      </div>
                    ))}
                  </div>

                  <div className="threat-cat-section-label">DETECTION PIPELINE</div>
                  <div className="threat-cat-pipeline">
                    {threat.pipeline.map((step, idx) => (
                      <div key={step} className="threat-pipe-step-wrap">
                        <div className={`threat-pipe-step ${idx === threat.pipeline.length - 1 ? "terminal" : ""}`}>
                          {step}
                        </div>
                        {idx < threat.pipeline.length - 1 && (
                          <ArrowRight size={12} style={{ color: "var(--color-stone)", flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* CURRENT DETECTIONS FOR THIS CLASS */}
                  {detectionCount > 0 && (
                    <>
                      <div className="threat-cat-section-label" style={{ color: "var(--severity-critical)" }}>
                        CURRENT DETECTIONS ({detectionCount})
                      </div>
                      <div className="threat-cat-detections">
                        {alerts
                          .filter((a) => a.threat_class === threat.id)
                          .slice(0, 3)
                          .map((a) => (
                            <div className="threat-cat-detection-row" key={a.alert_id}>
                              <span className={`badge-soc ${a.severity}`}>{a.severity}</span>
                              <span className="mono-text" style={{ fontSize: "11px" }}>
                                {a.source_ip} → {a.destination_ip}
                              </span>
                              <span className="mono-text" style={{ fontSize: "11px", color: "var(--color-caribbean-green)" }}>
                                {Math.round(a.confidence * 100)}% conf
                              </span>
                            </div>
                          ))}
                      </div>
                    </>
                  )}

                  {/* EVIDENCE EXAMPLES */}
                  <div className="threat-cat-section-label">EVIDENCE STRUCTURE</div>
                  <div className="threat-cat-evidence-preview">
                    <div className="threat-cat-ev-row">
                      <ShieldCheck size={12} style={{ color: "var(--color-caribbean-green)" }} />
                      <span>Deterministic rule evidence provided for each alert (feature + value + reason)</span>
                    </div>
                    <div className="threat-cat-ev-row">
                      <CheckCircle2 size={12} style={{ color: "var(--color-mountain-meadow)" }} />
                      <span>ML anomaly score and prediction appended when model is active</span>
                    </div>
                    <div className="threat-cat-ev-row">
                      <Layers size={12} style={{ color: "var(--color-stone)" }} />
                      <span>All evidence derived from passive flow metadata — no payload access</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

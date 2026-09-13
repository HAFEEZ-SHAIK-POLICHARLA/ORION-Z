export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type ThreatClass =
  | "ddos"
  | "botnet_beaconing"
  | "dns_tunnelling"
  | "dga"
  | "encrypted_session_anomaly"
  | "port_scanning"
  | "data_exfiltration"
  | "udp_amplification"
  | "slowloris"
  | "unknown_anomaly";

export interface Evidence {
  feature: string;
  value: string | number | boolean | number[];
  reason: string;
}

export interface Alert {
  alert_id: string;
  timestamp: string;
  flow_id: string;
  threat_class: ThreatClass;
  severity: Severity;
  confidence: number;
  source_ip: string;
  destination_ip: string;
  protocol: string;
  window_seconds: number;
  evidence: Evidence[];
  detector: string;
  model_version: string;
  source_mode?: "simulation" | "live";
  explanation?: string | null;
}

export interface Metrics {
  processed_events: number;
  alerts_generated: number;
  events_per_second: number;
  average_alert_latency_ms: number;
  scenario: string | null;
  status: "idle" | "running" | "completed" | "stopped" | "error";
  running: boolean;
  started_at: number | null;
  finished_at: number | null;
  threat_counts: Record<string, number>;
  error_count: number;
  last_error?: string;
  model_status?: { available: boolean; version: string };
  appwrite_status?: { enabled: boolean; persisted_count: number; last_error?: string | null };
  ollama_status?: { enabled: boolean; model: string; available: boolean };
}

export interface FlowEvent {
  timestamp: string;
  flow_id: string;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: string;
  packets: number;
  bytes: number;
  direction?: "inbound" | "outbound" | "unknown";
  tcp_flags?: string[];
  connection_completed?: boolean | null;
  dns_query?: string | null;
  dns_record_type?: string | null;
  tls_fingerprint?: string | null;
  tls_version?: string | null;
  tls_packet_sizes?: number[];
  source_mode?: "simulation" | "live";
}

export interface RealtimeMetrics {
  /** Primary engine status — uppercase as sent by the normalized backend endpoint. */
  status: "STOPPED" | "RUNNING_LIVE" | "PASSIVE_TAP_UNAVAILABLE" | "ERROR";
  /** SAFE/UNSAFE only meaningful when running===true. When running===false, backend sends SAFE as a harmless default — UI must always gate display on running. */
  system_state: "SAFE" | "UNSAFE";
  running: boolean;
  interface_name: string;
  flows_processed: number;
  alerts_generated: number;
  active_incidents: number;
  engine_uptime_seconds: number;
  detection_time_ms: number;
  last_error?: string | null;
  active_detectors: string[];
  /** True only when capture is genuinely active (RUNNING_LIVE + running). */
  sensor_ready?: boolean;
  /** "SENSOR_PREREQUISITE" when status===PASSIVE_TAP_UNAVAILABLE; null otherwise. */
  sensor_note?: "SENSOR_PREREQUISITE" | null;
}

export interface ReadinessCheckItem {
  installed?: boolean;
  granted?: boolean;
  ready?: boolean;
  status: string;
  detail: string;
}

export interface ReadinessChecks {
  can_capture: boolean;
  os: string;
  npcap_driver: ReadinessCheckItem;
  admin_privileges: ReadinessCheckItem;
  sensor_service: ReadinessCheckItem;
  network_interface: {
    name: string;
    status: string;
  };
  raw_error?: string | null;
}

export type SocketMessage =
  | { type: "flow"; flow: FlowEvent }
  | { type: "alert"; alert: Alert }
  | { type: "metrics"; metrics: Metrics }
  | { type: "live_status"; metrics: RealtimeMetrics }
  | { type: "explained"; alert_id: string; explanation: string; source: string };




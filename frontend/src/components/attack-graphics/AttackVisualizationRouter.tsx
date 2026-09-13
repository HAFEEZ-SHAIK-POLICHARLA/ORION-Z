import type { Alert, FlowEvent, Metrics } from "../../types";
import type { ExplainerStep } from "../AttackExplainer";

import { SynFloodVisualization } from "./scenarios/SynFloodVisualization";
import { PortScanVisualization } from "./scenarios/PortScanVisualization";
import { DnsTunnelVisualization } from "./scenarios/DnsTunnelVisualization";
import { DgaVisualization } from "./scenarios/DgaVisualization";
import { BeaconingVisualization } from "./scenarios/BeaconingVisualization";
import { EncryptedSessionVisualization } from "./scenarios/EncryptedSessionVisualization";
import { ExfiltrationVisualization } from "./scenarios/ExfiltrationVisualization";
import { UdpAmplificationVisualization } from "./scenarios/UdpAmplificationVisualization";
import { SlowlorisVisualization } from "./scenarios/SlowlorisVisualization";
import { RealTimeDetectionVisualization } from "./RealTimeDetectionVisualization";
import { AnomalyDetectionVisualization } from "./AnomalyDetectionVisualization";

interface RouterProps {
  scenario: string;
  step: ExplainerStep;
  latestAlert: Alert | null;
  flows: FlowEvent[];
  metrics: Metrics;
  resolvedThreat?: string;
}

/** Compute derived flow metrics for scenario-specific visualizations */
function deriveFlowMetrics(flows: FlowEvent[]) {
  if (!flows.length) {
    return { packetsPerSec: 0, synRatio: 0, incompleteRatio: 0, uniquePorts: 0, uniqueHosts: 0, outboundBytes: 0, outboundRatio: 0, avgQueryLen: 0 };
  }
  const totalPkts = flows.reduce((s, f) => s + f.packets, 0);
  const totalB = flows.reduce((s, f) => s + f.bytes, 0);
  void totalB;
  const timeSpan = Math.max(1,
    Math.abs((new Date(flows[0].timestamp).getTime() - new Date(flows[flows.length - 1].timestamp).getTime()) / 1000));
  const packetsPerSec = Math.round(totalPkts / timeSpan);
  const synEvents = flows.filter(f => f.tcp_flags?.includes("SYN")).length;
  const synRatio = Number((synEvents / flows.length).toFixed(3));
  const incompleteEvents = flows.filter(f => f.connection_completed === false).length;
  const incompleteRatio = Number((incompleteEvents / flows.length).toFixed(3));
  const uniquePorts = new Set(flows.map(f => f.destination_port)).size;
  const uniqueHosts = new Set(flows.map(f => f.destination_ip)).size;
  const outboundB = flows.filter(f => f.direction === "outbound").reduce((s, f) => s + f.bytes, 0);
  const inboundB = flows.filter(f => f.direction === "inbound").reduce((s, f) => s + f.bytes, 0);
  const outboundRatio = Number((outboundB / Math.max(1, inboundB)).toFixed(2));
  const dnsQ = flows.filter(f => Boolean(f.dns_query));
  const avgQueryLen = dnsQ.length > 0
    ? Math.round(dnsQ.reduce((s, f) => s + (f.dns_query?.length || 0), 0) / dnsQ.length)
    : 0;
  return { packetsPerSec, synRatio, incompleteRatio, uniquePorts, uniqueHosts, outboundBytes: outboundB, outboundRatio, avgQueryLen };
}

export function AttackVisualizationRouter({ scenario, step, latestAlert, flows, metrics, resolvedThreat }: RouterProps) {
  const hasAlert = Boolean(latestAlert);
  const m = deriveFlowMetrics(flows);
  const isCompleted = step === "complete" || step === "anomaly_complete";

  const renderContent = () => {
    if (scenario === "realtime_detection") {
      if (["scan_1", "scan_2", "scan_3", "scan_4", "scan_5", "transitioning", "ready"].includes(step) || !resolvedThreat) {
        return (
          <RealTimeDetectionVisualization
            step={step as any}
            identifiedThreat={resolvedThreat}
          />
        );
      }
      // Once radar scan phase completes, render the resolved threat visualization!
      return (
        <AttackVisualizationRouter
          scenario={resolvedThreat}
          step={step}
          latestAlert={latestAlert}
          flows={flows}
          metrics={metrics}
        />
      );
    }

    if (scenario === "anomaly_detection") {
      const mlAnomalyScore = latestAlert?.evidence.find(e => e.feature === "ml_anomaly_score")?.value as number | undefined;
      return (
        <AnomalyDetectionVisualization
          step={step as "ready" | "scan_1" | "scan_2" | "scan_3" | "scan_4" | "anomaly_complete"}
          anomalyScore={mlAnomalyScore ?? -0.418}
        />
      );
    }

    switch (scenario) {
      case "syn_flood":
        return <SynFloodVisualization step={step} hasAlert={hasAlert} flowCount={flows.length} />;

      case "port_scanning":
        return <PortScanVisualization step={step} hasAlert={hasAlert} uniquePorts={m.uniquePorts} />;

      case "dns_tunnelling":
        return <DnsTunnelVisualization step={step} hasAlert={hasAlert} avgQueryLen={m.avgQueryLen} />;

      case "dga":
        return <DgaVisualization step={step} hasAlert={hasAlert} />;

      case "beaconing":
        return <BeaconingVisualization step={step} hasAlert={hasAlert} />;

      case "encrypted_session":
        return <EncryptedSessionVisualization step={step} hasAlert={hasAlert} />;

      case "exfiltration":
        return (
          <ExfiltrationVisualization
            step={step}
            hasAlert={hasAlert}
            outboundBytes={m.outboundBytes}
            outboundRatio={m.outboundRatio}
          />
        );

      case "udp_amplification":
        return <UdpAmplificationVisualization step={step} hasAlert={hasAlert} packetsPerSec={m.packetsPerSec} />;

      case "slowloris":
        return <SlowlorisVisualization step={step} hasAlert={hasAlert} />;

      default:
        // Fallback: SYN flood for unknown scenarios
        return <SynFloodVisualization step={step} hasAlert={hasAlert} flowCount={flows.length} />;
    }
  };

  return (
    <div className={`attack-visualization-wrapper ${isCompleted ? "simulation-complete" : ""}`}>
      {renderContent()}
    </div>
  );
}

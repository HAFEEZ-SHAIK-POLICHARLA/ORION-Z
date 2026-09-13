from __future__ import annotations

import asyncio
import os
import socket
import threading
import time
from collections import Counter, deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .detectors import DetectionConfig, WindowedDetector
from .model import ThreatScorer, load_scorer
from .schemas import Alert, FlowEvent, Severity, ThreatClass

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MODEL_DIR = PROJECT_ROOT / "models"


class LiveTapManager:
    """Manages continuous passive network traffic acquisition and real-time detection."""

    def __init__(self, model_dir: Path = DEFAULT_MODEL_DIR) -> None:
        self.scorer: ThreatScorer | None = load_scorer(model_dir)
        self.model_status = {
            "available": self.scorer is not None,
            "version": self.scorer.version if self.scorer else "rules-only",
        }
        self._lock = threading.RLock()
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._subscribers: set[tuple[asyncio.AbstractEventLoop, asyncio.Queue[dict[str, Any]]]] = set()
        self.alerts: deque[Alert] = deque(maxlen=500)
        self.detector = WindowedDetector(DetectionConfig(), scorer=self.scorer)
        self.reset_metrics()

    def reset_metrics(self) -> None:
        with self._lock:
            self.metrics: dict[str, Any] = {
                "processed_events": 0,
                "alerts_generated": 0,
                "events_per_second": 0.0,
                "average_alert_latency_ms": 0.0,
                "status": "stopped",
                "running": False,
                "started_at": None,
                "finished_at": None,
                "threat_counts": {},
                "error_count": 0,
                "last_error": None,
                "interface": "eth0 / Passive Tap",
                "system_state": "SAFE",
                "active_threats_30s": 0,
                "model_status": self.model_status,
                "tap_mode": "passive_live",
            }

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive() and self.metrics["status"] == "running_live"

    def subscribe(self) -> tuple[asyncio.AbstractEventLoop, asyncio.Queue[dict[str, Any]]]:
        subscription = (asyncio.get_running_loop(), asyncio.Queue(maxsize=100))
        self._subscribers.add(subscription)
        return subscription

    def unsubscribe(self, subscription: tuple[asyncio.AbstractEventLoop, asyncio.Queue[dict[str, Any]]]) -> None:
        self._subscribers.discard(subscription)

    def _broadcast(self, message: dict[str, Any]) -> None:
        for loop, queue in list(self._subscribers):
            loop.call_soon_threadsafe(self._put_message, queue, message)

    @staticmethod
    def _put_message(queue: asyncio.Queue[dict[str, Any]], message: dict[str, Any]) -> None:
        try:
            queue.put_nowait(message)
        except asyncio.QueueFull:
            try:
                queue.get_nowait()
                queue.put_nowait(message)
            except asyncio.QueueEmpty:
                pass

    def start(self) -> dict[str, Any]:
        """Attempt starting passive live network tap."""
        if self.is_running():
            return self.metrics

        # Probe passive capture capability
        can_capture, reason = self._probe_passive_capture()
        if not can_capture:
            with self._lock:
                self.metrics["status"] = "PASSIVE_TAP_UNAVAILABLE"
                self.metrics["running"] = False
                self.metrics["last_error"] = reason
                self.metrics["error_count"] += 1
            self._broadcast({"type": "live_status", "metrics": self.metrics})
            return self.metrics

        self._stop.clear()
        self.reset_metrics()
        with self._lock:
            self.metrics["status"] = "running_live"
            self.metrics["running"] = True
            self.metrics["started_at"] = time.time()
        
        self._thread = threading.Thread(
            target=self._run_live_capture,
            daemon=True,
            name="sih-live-sniff",
        )
        self._thread.start()
        self._broadcast({"type": "live_status", "metrics": self.metrics})
        return self.metrics

    def stop(self) -> dict[str, Any]:
        """Stop backend live capture loop cleanly without zombie threads."""
        self._stop.set()
        if self._thread and self._thread is not threading.current_thread():
            self._thread.join(timeout=1.0)
        with self._lock:
            self.metrics["status"] = "stopped"
            self.metrics["running"] = False
            self.metrics["finished_at"] = time.time()
        self._broadcast({"type": "live_status", "metrics": self.metrics})
        return self.metrics

    def _probe_passive_capture(self) -> tuple[bool, str]:
        """Check if Scapy / WinPcap / Npcap or raw socket permissions exist."""
        # First check scapy
        try:
            import scapy.all as scapy
            return True, "Scapy raw packet engine available"
        except ImportError:
            pass

        # Try raw socket binding on Windows/Linux
        try:
            if os.name == "nt":
                # Raw sockets on Windows require Administrator
                s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
                s.close()
                return True, "Windows Raw Socket available"
            else:
                s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(0x0003))
                s.close()
                return True, "Linux AF_PACKET Raw Socket available"
        except (PermissionError, OSError) as exc:
            return False, (
                "Passive network capture unavailable. Driver/Permission Prerequisite Required: "
                "Windows requires Npcap driver installed and Administrator privileges. "
                f"Diagnostic details: {exc}"
            )

    def _run_live_capture(self) -> None:
        """Continuous passive traffic capture loop."""
        try:
            import scapy.all as scapy  # type: ignore
            def handle_pkt(pkt: Any) -> None:
                if self._stop.is_set():
                    return
                flow = self._scapy_pkt_to_flow(pkt)
                if flow:
                    self.process_flow(flow)

            scapy.sniff(prn=handle_pkt, stop_filter=lambda _: self._stop.is_set(), store=False)
        except Exception as exc:
            try:
                self._run_raw_socket_capture()
            except Exception as raw_exc:
                with self._lock:
                    self.metrics["status"] = "PASSIVE_TAP_UNAVAILABLE"
                    self.metrics["running"] = False
                    self.metrics["last_error"] = f"Capture failed: {raw_exc}"
                    self.metrics["error_count"] += 1
                self._broadcast({"type": "live_status", "metrics": self.metrics})

    def _run_raw_socket_capture(self) -> None:
        s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
        s.settimeout(0.5)
        while not self._stop.is_set():
            try:
                raw_data, addr = s.recvfrom(65535)
                flow = self._raw_ip_to_flow(raw_data, addr[0])
                if flow:
                    self.process_flow(flow)
            except socket.timeout:
                continue
            except Exception:
                break
        s.close()

    def get_readiness_checks(self) -> dict[str, Any]:
        """Return structured host readiness checks for Live Passive Detection."""
        is_windows = os.name == "nt"
        has_scapy = False
        try:
            import scapy.all  # type: ignore
            has_scapy = True
        except ImportError:
            pass

        has_raw_socket = False
        raw_error = None
        try:
            if is_windows:
                s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
                s.close()
                has_raw_socket = True
            else:
                s = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(0x0003))
                s.close()
                has_raw_socket = True
        except Exception as exc:
            raw_error = str(exc)

        is_admin = False
        if is_windows:
            try:
                import ctypes
                is_admin = bool(ctypes.windll.shell32.IsUserAnAdmin())
            except Exception:
                is_admin = False
        else:
            is_admin = (os.geteuid() == 0) if hasattr(os, "geteuid") else False

        can_capture = has_scapy or has_raw_socket

        return {
            "can_capture": can_capture,
            "os": "Windows" if is_windows else "Linux/Unix",
            "npcap_driver": {
                "installed": has_scapy or has_raw_socket,
                "status": "DETECTED" if (has_scapy or has_raw_socket) else "REQUIRED_MISSING",
                "detail": "Scapy/Npcap driver available" if (has_scapy or has_raw_socket) else "Npcap packet capture driver required on Windows",
            },
            "admin_privileges": {
                "granted": is_admin,
                "status": "GRANTED" if is_admin else "REQUIRED_MISSING",
                "detail": "Administrator privileges active" if is_admin else "Administrator / elevated permissions required for raw tap socket",
            },
            "sensor_service": {
                "ready": True,
                "status": "READY",
                "detail": "ORION-Z Live Detector engine loaded and standing by",
            },
            "network_interface": {
                "name": self.metrics.get("interface", "eth0 / Passive Tap"),
                "status": "PROMISCUOUS_READY" if can_capture else "WAITING_DRIVER",
            },
            "raw_error": raw_error,
        }

    def process_flow(self, flow: FlowEvent) -> list[Alert]:
        if self._stop.is_set():
            return []

        flow.source_mode = "live"
        start_time = time.perf_counter()
        alerts = self.detector.process(flow)
        latency = (time.perf_counter() - start_time) * 1000

        with self._lock:
            self.metrics["processed_events"] += 1
            processed = self.metrics["processed_events"]
            prev_lat = self.metrics["average_alert_latency_ms"]
            self.metrics["average_alert_latency_ms"] = round(((prev_lat * (processed - 1)) + latency) / processed, 3)

            for alert in alerts:
                alert.source_mode = "live"
                self.alerts.appendleft(alert)
                self.metrics["alerts_generated"] += 1
                counts = self.metrics.get("threat_counts", {})
                counts[alert.threat_class] = counts.get(alert.threat_class, 0) + 1
                self.metrics["threat_counts"] = counts

            # Update SAFE vs UNSAFE state based on active alerts in last 30 seconds
            now = datetime.now(timezone.utc)
            active_threats = [
                a for a in self.alerts
                if (now - a.timestamp).total_seconds() <= 30.0 and a.severity in (Severity.CRITICAL, Severity.HIGH)
            ]
            self.metrics["active_threats_30s"] = len(active_threats)
            self.metrics["system_state"] = "UNSAFE" if len(active_threats) > 0 else "SAFE"

        self._broadcast({"type": "live_flow", "flow": flow.model_dump(mode="json")})
        for alert in alerts:
            self._broadcast({"type": "live_alert", "alert": alert.model_dump(mode="json")})
        self._broadcast({"type": "live_status", "metrics": self.metrics})
        return alerts


    @staticmethod
    def _scapy_pkt_to_flow(pkt: Any) -> FlowEvent | None:
        try:
            import scapy.all as scapy  # type: ignore
            if not pkt.haslayer(scapy.IP):
                return None
            ip = pkt[scapy.IP]
            src_ip = ip.src
            dst_ip = ip.dst
            proto = "TCP" if pkt.haslayer(scapy.TCP) else "UDP" if pkt.haslayer(scapy.UDP) else "IP"
            src_port = pkt[scapy.TCP].sport if pkt.haslayer(scapy.TCP) else pkt[scapy.UDP].sport if pkt.haslayer(scapy.UDP) else 0
            dst_port = pkt[scapy.TCP].dport if pkt.haslayer(scapy.TCP) else pkt[scapy.UDP].dport if pkt.haslayer(scapy.UDP) else 0
            flags = []
            if pkt.haslayer(scapy.TCP):
                tcp = pkt[scapy.TCP]
                if tcp.flags.S: flags.append("SYN")
                if tcp.flags.A: flags.append("ACK")
                if tcp.flags.F: flags.append("FIN")

            return FlowEvent(
                timestamp=datetime.now(timezone.utc),
                flow_id=f"flow_{src_ip}:{src_port}->{dst_ip}:{dst_port}",
                source_ip=src_ip,
                destination_ip=dst_ip,
                source_port=src_port,
                destination_port=dst_port,
                protocol=proto,
                packets=1,
                bytes=len(pkt),
                direction="inbound",
                tcp_flags=flags,
                connection_completed="ACK" in flags if flags else True,
            )
        except Exception:
            return None

    @staticmethod
    def _raw_ip_to_flow(raw_data: bytes, src_addr: str) -> FlowEvent | None:
        if len(raw_data) < 20:
            return None
        proto_num = raw_data[9]
        proto = "TCP" if proto_num == 6 else "UDP" if proto_num == 17 else "IP"
        return FlowEvent(
            timestamp=datetime.now(timezone.utc),
            flow_id=f"raw_{src_addr}_{time.time_ns()}",
            source_ip=src_addr,
            destination_ip="127.0.0.1",
            source_port=0,
            destination_port=0,
            protocol=proto,
            packets=1,
            bytes=len(raw_data),
            direction="inbound",
        )

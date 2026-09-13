from __future__ import annotations

import asyncio
import os
import threading
import time
from collections import Counter, deque
from pathlib import Path
from typing import Any

from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .appwrite import AppwriteAlertSink
from .detectors import DetectionConfig, WindowedDetector
from .explain import check_ollama, generate_explanation
from .live import LiveTapManager
from .model import load_scorer
from .paths import FIXTURES_DIR, MODELS_DIR
from .replay import read_events, replay
from .schemas import Alert

DEFAULT_FIXTURE_DIR = FIXTURES_DIR
DEFAULT_MODEL_DIR = MODELS_DIR

KNOWN_SCENARIOS = {
    "syn_flood",
    "port_scanning",
    "dns_tunnelling",
    "dga",
    "beaconing",
    "encrypted_session",
    "exfiltration",
    "udp_amplification",
    "slowloris",
}


class ReplayRequest(BaseModel):
    scenario: str = Field(min_length=1)
    speed: float = Field(default=1.0, gt=0)


class ReplayManager:
    def __init__(
        self,
        fixture_dir: Path = DEFAULT_FIXTURE_DIR,
        model_dir: Path = DEFAULT_MODEL_DIR,
    ) -> None:
        self.fixture_dir = fixture_dir
        self.scorer = load_scorer(model_dir)
        self.model_status = {
            "available": self.scorer is not None,
            "version": self.scorer.version if self.scorer else "rules-only",
        }
        self._lock = threading.RLock()
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()
        self._subscribers: set[tuple[asyncio.AbstractEventLoop, asyncio.Queue[dict[str, Any]]]] = set()
        self.alerts: deque[Alert] = deque(maxlen=500)
        self.appwrite_sink = AppwriteAlertSink()
        self.ollama_status: dict[str, Any] = {
            "enabled": bool(os.getenv("OLLAMA_URL") or os.getenv("OLLAMA_MODEL")),
            "model": os.getenv("OLLAMA_MODEL", "qwen2.5:3b-instruct"),
            "available": False,
        }
        self.reset_metrics()

    def reset_metrics(self) -> None:
        with self._lock:
            self.metrics: dict[str, Any] = {
                "processed_events": 0,
                "alerts_generated": 0,
                "events_per_second": 0.0,
                "average_alert_latency_ms": 0.0,
                "scenario": None,
                "status": "idle",
                "running": False,
                "started_at": None,
                "finished_at": None,
                "threat_counts": {},
                "error_count": 0,
                "model_status": self.model_status,
                "appwrite_status": self.appwrite_sink.status(),
                "ollama_status": self.ollama_status,
            }

    def scenarios(self) -> list[str]:
        if not self.fixture_dir.exists():
            return []
        return sorted(path.stem for path in self.fixture_dir.glob("*.jsonl"))

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive() and self.metrics["status"] == "running"

    def start(self, scenario: str, speed: float) -> None:
        if self.is_running():
            self.stop()
        if scenario not in KNOWN_SCENARIOS and not (self.fixture_dir / f"{scenario}.jsonl").is_file():
            raise ValueError(f"Invalid scenario identifier: {scenario}")

        path = self.fixture_dir / f"{scenario}.jsonl"
        if not path.is_file():
            raise FileNotFoundError(f"Replay fixture not found: {scenario}")

        self._stop.clear()
        self.alerts.clear()
        self.reset_metrics()
        self.metrics.update({"scenario": scenario, "status": "running", "running": True, "started_at": time.time()})
        self._thread = threading.Thread(
            target=self._run,
            args=(path, speed),
            daemon=True,
            name="sih-replay",
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread and self._thread is not threading.current_thread():
            self._thread.join(timeout=1.0)
        with self._lock:
            if self.metrics["status"] == "running":
                self.metrics["status"] = "stopped"
                self.metrics["running"] = False
                self.metrics["finished_at"] = time.time()
        self._broadcast({"type": "metrics", "metrics": self.metrics})

    def subscribe(self) -> tuple[asyncio.AbstractEventLoop, asyncio.Queue[dict[str, Any]]]:
        subscription = (asyncio.get_running_loop(), asyncio.Queue(maxsize=100))
        self._subscribers.add(subscription)
        return subscription

    def unsubscribe(self, subscription: tuple[asyncio.AbstractEventLoop, asyncio.Queue[dict[str, Any]]]) -> None:
        self._subscribers.discard(subscription)

    def _run(self, path: Path, speed: float) -> None:
        detector = WindowedDetector(DetectionConfig(), scorer=self.scorer)
        started = time.perf_counter()
        last_event_time = None
        threat_counts: Counter[str] = Counter()

        def handle_event(event: Any) -> list[Alert]:
            nonlocal last_event_time
            if self._stop.is_set():
                return []
            if last_event_time is not None:
                source_gap = max(0.0, (event.timestamp - last_event_time).total_seconds())
                if source_gap > 0:
                    stopped = self._stop.wait(source_gap / speed)
                    if stopped or self._stop.is_set():
                        return []
            last_event_time = event.timestamp
            processing_started = time.perf_counter()
            alerts = detector.process(event)
            processing_latency_ms = (time.perf_counter() - processing_started) * 1000
            with self._lock:
                self.metrics["processed_events"] += 1
                processed = self.metrics["processed_events"]
                previous_average = self.metrics["average_alert_latency_ms"]
                self.metrics["average_alert_latency_ms"] = round(
                    ((previous_average * (processed - 1)) + processing_latency_ms) / processed,
                    3,
                )
            self._broadcast({"type": "flow", "flow": event.model_dump(mode="json")})
            return alerts

        def handle_alert(alert: Alert) -> None:
            with self._lock:
                self.alerts.appendleft(alert)
                self.metrics["alerts_generated"] += 1
                threat_counts[alert.threat_class] += 1
                self.metrics["threat_counts"] = dict(threat_counts)
            try:
                self.appwrite_sink.persist(alert)
            except Exception as exc:
                with self._lock:
                    self.metrics["error_count"] += 1
                    self.metrics["last_error"] = f"Appwrite persistence failed: {exc}"
            self._broadcast({"type": "alert", "alert": alert.model_dump(mode="json")})
            self._enqueue_explanation(alert)

        try:
            replay(read_events(path), handle_event, handle_alert, stop_event=self._stop)
            status = "stopped" if self._stop.is_set() else "completed"
        except Exception as exc:
            with self._lock:
                self.metrics["error_count"] += 1
                self.metrics["last_error"] = str(exc)
            status = "error"
        with self._lock:
            elapsed = max(time.perf_counter() - started, 0.001)
            self.metrics["events_per_second"] = round(self.metrics["processed_events"] / elapsed, 2)
            self.metrics["status"] = status
            self.metrics["running"] = False
            self.metrics["finished_at"] = time.time()
        self._broadcast({"type": "metrics", "metrics": self.metrics})

    def _enqueue_explanation(self, alert: Alert) -> None:
        """Queue the alert for asynchronous explanation without blocking the replay."""
        for loop, _queue in list(self._subscribers):
            loop.call_soon_threadsafe(explanation_queue.put_nowait, alert)

    def _broadcast(self, message: dict[str, Any]) -> None:
        for loop, queue in list(self._subscribers):
            loop.call_soon_threadsafe(self._put_message, queue, message)

    @staticmethod
    def _put_message(queue: asyncio.Queue[dict[str, Any]], message: dict[str, Any]) -> None:
        try:
            queue.put_nowait(message)
        except asyncio.QueueFull:
            if message.get("type") == "alert":
                # Evict a flow message to make room for critical alert message
                try:
                    evicted = False
                    for _ in range(queue.qsize()):
                        item = queue.get_nowait()
                        if not evicted and item.get("type") == "flow":
                            evicted = True
                            continue
                        queue.put_nowait(item)
                    queue.put_nowait(message)
                    return
                except (asyncio.QueueFull, asyncio.QueueEmpty):
                    pass
            try:
                queue.get_nowait()
                queue.put_nowait(message)
            except asyncio.QueueEmpty:
                pass


explanation_queue: asyncio.Queue[Alert] = asyncio.Queue(maxsize=256)

manager = ReplayManager()
live_manager = LiveTapManager()


async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Probe Ollama on startup and stop the explanation worker on shutdown."""
    await startup()
    yield
    await shutdown()


app = FastAPI(title="SIH26145 Detection API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, Any]:
    fixtures_ok = FIXTURES_DIR.exists()
    models_ok = MODELS_DIR.exists()
    return {
        "status": "ok",
        "mode": "read_only_replay",
        "fixtures": {
            "available": fixtures_ok,
            "count": len(list(FIXTURES_DIR.glob("*.jsonl"))) if fixtures_ok else 0,
        },
        "models": {
            "available": models_ok and (MODELS_DIR / "threat_classifier.joblib").is_file(),
        },
    }


@app.get("/api/readiness")
def readiness() -> dict[str, Any]:
    issues: list[str] = []
    fixtures_ok = FIXTURES_DIR.exists()
    scenario_files = list(FIXTURES_DIR.glob("*.jsonl")) if fixtures_ok else []
    fixture_count = len(scenario_files)

    found_scenarios = {f.stem for f in scenario_files}
    missing_scenarios = KNOWN_SCENARIOS - found_scenarios
    if not fixtures_ok:
        issues.append("fixtures directory missing")
    elif missing_scenarios:
        for s in sorted(missing_scenarios):
            issues.append(f"missing fixture: {s}.jsonl")

    models_ok = MODELS_DIR.exists()
    classifier_ok = (MODELS_DIR / "threat_classifier.joblib").is_file() if models_ok else False
    anomaly_ok = (MODELS_DIR / "anomaly_detector.joblib").is_file() if models_ok else False
    meta_ok = (MODELS_DIR / "model_meta.json").is_file() if models_ok else False

    if not models_ok:
        issues.append("models directory missing")
    else:
        if not classifier_ok:
            issues.append("missing model: threat_classifier.joblib")
        if not anomaly_ok:
            issues.append("missing model: anomaly_detector.joblib")
        if not meta_ok:
            issues.append("missing model: model_meta.json")

    is_ready = len(issues) == 0
    res: dict[str, Any] = {
        "ready": is_ready,
        "service": "backend",
        "fixtures": {
            "ready": fixtures_ok and len(missing_scenarios) == 0,
            "count": fixture_count,
        },
        "models": {
            "ready": classifier_ok and anomaly_ok and meta_ok,
            "classifier": classifier_ok,
            "anomaly_detector": anomaly_ok,
            "metadata": meta_ok,
        },
    }
    if issues:
        res["issues"] = issues
    return res


def check_runtime_resources() -> dict[str, Any]:
    return readiness()


@app.get("/api/engine/health")
def engine_health() -> dict[str, Any]:
    """Detailed operational health status for all system microservices."""
    return {
        "fastapi_backend": {"status": "ok", "port": 8000},
        "realtime_engine": live_manager.metrics,
        "threat_lab_replayer": manager.metrics,
        "rule_engine": {"status": "ok", "detectors_count": 9},
        "ml_engine": manager.model_status,
        "appwrite": manager.appwrite_sink.status(),
        "ollama": manager.ollama_status,
    }


@app.get("/api/scenarios")
def scenarios() -> dict[str, list[str]]:
    if not FIXTURES_DIR.exists():
        raise HTTPException(status_code=500, detail="Fixtures directory missing")
    scenarios_list = manager.scenarios()
    if not scenarios_list:
        raise HTTPException(status_code=500, detail="No scenario fixtures available")
    return {"scenarios": scenarios_list}


@app.get("/api/metrics")
def metrics() -> dict[str, Any]:
    return manager.metrics


@app.get("/api/realtime/status")
def realtime_status() -> dict[str, Any]:
    return _normalize_realtime(live_manager.metrics)


@app.get("/api/realtime/readiness")
def realtime_readiness() -> dict[str, Any]:
    return live_manager.get_readiness_checks()



@app.post("/api/realtime/start")
def start_realtime() -> dict[str, Any]:
    return _normalize_realtime(live_manager.start())


@app.post("/api/realtime/stop")
def stop_realtime() -> dict[str, Any]:
    return _normalize_realtime(live_manager.stop())


def _normalize_realtime(m: dict[str, Any]) -> dict[str, Any]:
    """Map internal LiveTapManager metric keys to the frontend RealtimeMetrics schema."""
    raw_status = m.get("status", "stopped")
    # Map internal lowercase status to uppercase frontend enum values
    status_map = {
        "stopped": "STOPPED",
        "running_live": "RUNNING_LIVE",
        "PASSIVE_TAP_UNAVAILABLE": "PASSIVE_TAP_UNAVAILABLE",
        "ERROR": "ERROR",
    }
    frontend_status = status_map.get(raw_status, raw_status.upper() if isinstance(raw_status, str) else "STOPPED")

    # Determine system_state: only SAFE/UNSAFE when actually running_live, else SENSOR_NOT_RUNNING
    raw_state = m.get("system_state", "SAFE")
    is_running = bool(m.get("running", False))
    # Never claim SAFE when engine is not actively capturing
    system_state: str = raw_state if is_running else "SENSOR_NOT_RUNNING"

    return {
        "status": frontend_status,
        # Keep original system_state for running engine; use sentinel for stopped so UI
        # never falsely shows "SAFE" when capture is not active.
        "system_state": raw_state if is_running else "SAFE",  # UI safe fallback — guarded by `running`
        "running": is_running,
        "interface_name": m.get("interface_name") or m.get("interface") or "",
        "flows_processed": m.get("processed_events", 0),
        "alerts_generated": m.get("alerts_generated", 0),
        "active_incidents": m.get("active_threats_30s", 0),
        "engine_uptime_seconds": int(
            (time.time() - m["started_at"]) if (is_running and m.get("started_at")) else 0
        ),
        "detection_time_ms": m.get("average_alert_latency_ms", 0.0),
        "last_error": m.get("last_error"),
        "active_detectors": m.get("active_detectors", []),
        # Extra fields for UI classification
        "sensor_ready": frontend_status == "RUNNING_LIVE",
        "sensor_note": (
            None if is_running else (
                "SENSOR_PREREQUISITE" if frontend_status == "PASSIVE_TAP_UNAVAILABLE" else None
            )
        ),
    }



@app.get("/api/alerts")
def alerts(limit: int = 100) -> dict[str, list[dict[str, Any]]]:
    bounded_limit = max(1, min(limit, 500))
    all_alerts = list(live_manager.alerts) + list(manager.alerts)
    all_alerts.sort(key=lambda a: a.timestamp, reverse=True)
    return {"alerts": [alert.model_dump(mode="json") for alert in all_alerts[:bounded_limit]]}


@app.post("/api/replay/start")
def start_replay(request: ReplayRequest) -> dict[str, str]:
    try:
        manager.start(request.scenario, request.speed)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"status": "started", "scenario": request.scenario}


@app.post("/api/replay/stop")
def stop_replay() -> dict[str, str]:
    manager.stop()
    return {"status": "stopped"}


@app.websocket("/ws/alerts")
async def alert_socket(websocket: WebSocket) -> None:
    await websocket.accept()
    replay_sub = manager.subscribe()
    live_sub = live_manager.subscribe()

    async def forward_queue(subscription_tuple: tuple[asyncio.AbstractEventLoop, asyncio.Queue[dict[str, Any]]]) -> None:
        while True:
            msg = await subscription_tuple[1].get()
            await websocket.send_json(msg)

    t1 = asyncio.create_task(forward_queue(replay_sub))
    t2 = asyncio.create_task(forward_queue(live_sub))
    try:
        await websocket.send_json({"type": "metrics", "metrics": manager.metrics})
        await websocket.send_json({"type": "live_status", "metrics": live_manager.metrics})
        await asyncio.gather(t1, t2)
    except (WebSocketDisconnect, asyncio.CancelledError, Exception):
        pass
    finally:
        t1.cancel()
        t2.cancel()
        manager.unsubscribe(replay_sub)
        live_manager.unsubscribe(live_sub)



@app.get("/api/explain/{alert_id}")
async def get_explanation(alert_id: str) -> dict[str, Any]:
    """Trigger and return an explanation for a single stored alert on demand."""
    alert = next((item for item in manager.alerts if item.alert_id == alert_id), None)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.explanation:
        return {"alert_id": alert_id, "explanation": alert.explanation, "source": "ollama_or_cached"}
    result = await generate_explanation(alert)
    alert.explanation = result.explanation
    manager._broadcast(
        {
            "type": "explained",
            "alert_id": alert_id,
            "explanation": result.explanation,
            "source": result.source,
        }
    )
    return {"alert_id": alert_id, "explanation": result.explanation, "source": result.source}


explainer_task: asyncio.Task[None] | None = None


async def startup() -> None:
    """Probe Ollama and start the asynchronous explanation worker."""
    global explainer_task
    manager.ollama_status["available"] = await check_ollama()

    async def on_explained(alert_id: str, result: Any) -> None:
        explanation, source = result.explanation, result.source
        with manager._lock:
            for alert in manager.alerts:
                if alert.alert_id == alert_id:
                    alert.explanation = explanation
                    break
        manager._broadcast(
            {
                "type": "explained",
                "alert_id": alert_id,
                "explanation": explanation,
                "source": source,
            }
        )

    async def drain() -> None:
        while True:
            alert = await explanation_queue.get()
            result = await generate_explanation(alert)
            await on_explained(alert.alert_id, result)

    explainer_task = asyncio.create_task(drain())


async def shutdown() -> None:
    global explainer_task
    if explainer_task is not None:
        explainer_task.cancel()
        try:
            await explainer_task
        except asyncio.CancelledError:
            pass
        explainer_task = None


def run() -> None:
    import uvicorn

    uvicorn.run("sih_detector.api:app", host="127.0.0.1", port=8000, reload=False)


if __name__ == "__main__":
    run()

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  Activity,
  BookOpen,
  FlaskConical,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type NavTab = "landing" | "dashboard" | "realtime" | "system" | "threats" | "threatlab" | "lab-results";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  return (
    <aside className={`v2-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="v2-sidebar-top">
        <button
          className="v2-sidebar-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="v2-sidebar-nav">
        {/* DOMAIN A: EXPLORE */}
        <div className="v2-nav-section">
          {!collapsed && <span className="v2-nav-section-title">EXPLORE</span>}

          <button
            className={`v2-nav-button ${path === "/threatlab" ? "active" : ""}`}
            onClick={() => navigate("/threatlab")}
            title="Controlled Scenario Simulator & Replay Enclave"
          >
            <FlaskConical size={18} />
            {!collapsed && <span>Threat Lab</span>}
          </button>

          <button
            className={`v2-nav-button ${path === "/lab-results" ? "active" : ""}`}
            onClick={() => navigate("/lab-results")}
            title="Controlled Simulation Analytics & Detection Results"
          >
            <BarChart2 size={18} />
            {!collapsed && <span>Lab Results</span>}
          </button>

          <button
            className={`v2-nav-button ${path === "/threats" ? "active" : ""}`}
            onClick={() => navigate("/threats")}
            title="Threat Intelligence & Knowledge Base"
          >
            <BookOpen size={18} />
            {!collapsed && <span>Threat Intelligence</span>}
          </button>
        </div>

        {/* DOMAIN B: OPERATIONS */}
        <div className="v2-nav-section">
          {!collapsed && <span className="v2-nav-section-title">OPERATIONS</span>}

          <button
            className={`v2-nav-button ${path === "/dashboard" ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
            title="Live Operational Dashboard"
          >
            <LayoutDashboard size={18} />
            {!collapsed && <span>Dashboard</span>}
          </button>

          <button
            className={`v2-nav-button ${path === "/realtime" ? "active" : ""}`}
            onClick={() => navigate("/realtime")}
            title="Real-Time Passive Network Detection & Sensor Readiness"
          >
            <Radio size={18} />
            {!collapsed && <span>Real-Time Detection</span>}
          </button>

          <button
            className={`v2-nav-button ${path === "/system-health" ? "active" : ""}`}
            onClick={() => navigate("/system-health")}
            title="Subsystem Health & Infrastructure Monitor"
          >
            <Activity size={18} />
            {!collapsed && <span>System Health</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

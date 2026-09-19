import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { OrionZHeaderMark } from "../OrionZHeaderMark";

export const LandingNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="oz-landing-nav">
      <div className="oz-landing-nav-container">
        <a href="#" className="oz-landing-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <OrionZHeaderMark size={32} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="oz-landing-brand-title">ORION-Z</span>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>
              SIH26145 • UNIDIRECTIONAL NDR
            </span>
          </div>
        </a>

        <nav className="oz-landing-nav-links">
          <a href="#platform" className="oz-landing-nav-link">Platform</a>
          <a href="#pipeline" className="oz-landing-nav-link">Pipeline</a>
          <a href="#detection" className="oz-landing-nav-link">Detection</a>
          <a href="#scenarios" className="oz-landing-nav-link">Threat Scenarios</a>
          <a href="#explainability" className="oz-landing-nav-link">Explainability</a>
          <a href="#architecture" className="oz-landing-nav-link">Architecture</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="oz-landing-btn-secondary"
            style={{ padding: "8px 14px", fontSize: "12px" }}
            onClick={() => navigate("/realtime")}
          >
            <span>REAL-TIME</span>
          </button>
          <button
            className="oz-landing-btn-primary"
            style={{ padding: "8px 14px", fontSize: "12px" }}
            onClick={() => navigate("/threatlab")}
          >
            <span>THREAT LAB</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Activity, Eye } from "lucide-react";

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="oz-landing-hero-wrapper" id="platform">
      <div className="oz-landing-hero-bg" />
      <div className="oz-landing-grid-overlay" />

      <div className="oz-landing-hero-content">
        <div className="oz-landing-kicker">
          <Eye size={14} />
          <span>PASSIVE TELEMETRY & BEHAVIORAL THREAT INTELLIGENCE</span>
        </div>

        <h1 className="oz-landing-title">
          See the threats hidden <br />
          <span className="oz-landing-title-accent">inside the traffic.</span>
        </h1>

        <p className="oz-landing-subtitle">
          ORION-Z passively analyzes network traffic and combines deterministic rules,
          Random Forest classification, Isolation Forest anomaly scoring, and evidence correlation
          to identify suspicious behavior in high-assurance unidirectional enclaves.
        </p>

        <div className="oz-landing-hero-ctas">
          <button
            className="oz-landing-btn-primary"
            style={{ padding: "14px 28px", fontSize: "15px" }}
            onClick={() => navigate("/threatlab")}
          >
            <span>GET STARTED</span>
            <ArrowRight size={18} />
          </button>
          <a
            href="#detection"
            className="oz-landing-btn-secondary"
            style={{ padding: "14px 28px", fontSize: "15px" }}
          >
            <Activity size={16} />
            <span>EXPLORE DETECTION</span>
          </a>
        </div>
      </div>
    </section>
  );
};

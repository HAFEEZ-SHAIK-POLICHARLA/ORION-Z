import React from "react";
import { LandingNav } from "./landing/LandingNav";
import { LandingHero } from "./landing/LandingHero";
import { LandingHeroVisual } from "./landing/LandingHeroVisual";
import { LandingPipeline } from "./landing/LandingPipeline";
import { LandingHybridEngine } from "./landing/LandingHybridEngine";
import { LandingCentralNode } from "./landing/LandingCentralNode";
import { LandingThreatShowcase } from "./landing/LandingThreatShowcase";
import { LandingExplainability } from "./landing/LandingExplainability";
import { LandingRealTime } from "./landing/LandingRealTime";
import { LandingThreatLab } from "./landing/LandingThreatLab";
import { LandingAnomaly } from "./landing/LandingAnomaly";
import { LandingMultiPanel } from "./landing/LandingMultiPanel";
import { LandingArchitecture } from "./landing/LandingArchitecture";
import { LandingFooter } from "./landing/LandingFooter";
import { LandingScrollManager } from "./landing/LandingMotion";

interface LandingViewProps {
  onGetStarted?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = () => {
  return (
    <LandingScrollManager>
      <div className="oz-landing-page">
        {/* 01 — Persistent Header Navigation */}
        <LandingNav />

        {/* 02 — Atmospheric Hero Section */}
        <LandingHero />

        {/* 03 — Hero Product Visual Composition */}
        <LandingHeroVisual />

        {/* 04 — Product Capability Telemetry Pipeline */}
        <LandingPipeline />

        {/* 05 — Hybrid Detection Architecture (Rule + RF + IF) */}
        <LandingHybridEngine />

        {/* 06 — Central Intelligence Network Topology */}
        <LandingCentralNode />

        {/* 07 — Threat Scenario Showcase (9 Attack Types) */}
        <LandingThreatShowcase />

        {/* 08 — Explainability & Evidence Breakdown */}
        <LandingExplainability />

        {/* 09 — Real-Time Operations Distinction */}
        <LandingRealTime />

        {/* 10 — Threat Lab Sandbox Progression */}
        <LandingThreatLab />

        {/* 11 — Behavioral Anomaly Scatter Cluster */}
        <LandingAnomaly />

        {/* 12 — Multi-Panel Product Composition */}
        <LandingMultiPanel />

        {/* 13 — System Technical Architecture */}
        <LandingArchitecture />

        {/* 14 — Final Editorial CTA & Footer */}
        <LandingFooter />
      </div>
    </LandingScrollManager>
  );
};

export default LandingView;

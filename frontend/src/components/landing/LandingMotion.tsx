import React, { useEffect } from "react";

export const useLandingScrollMotion = () => {
  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    const updateScrollMotion = () => {
      const vh = window.innerHeight;
      const sections = document.querySelectorAll<HTMLElement>(
        ".oz-landing-hero-wrapper, .oz-landing-hero-visual, .oz-landing-section, .oz-landing-footer"
      );

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        
        // Skip if section is far out of view to save GPU cycles
        if (rect.bottom < -200 || rect.top > vh + 200) return;

        // Progress ratio from 0.0 (bottom entering) to 1.0 (top exiting)
        const totalDist = vh + rect.height;
        const currentDist = vh - rect.top;
        const progress = Math.min(1, Math.max(0, currentDist / totalDist));

        // Entrance progress ratio (0 -> 1 as section enters viewport up to ~70% screen)
        const enterDist = vh * 0.75;
        const enterProgress = Math.min(1, Math.max(0, (vh - rect.top) / enterDist));

        // Exit progress ratio (1 -> 0 as section leaves top of screen)
        const exitProgress = Math.min(1, Math.max(0, rect.bottom / (vh * 0.4)));

        // Reveal opacity & translation
        const opacity = Math.min(1, Math.max(0, enterProgress * 1.2)) * Math.min(1, Math.max(0, exitProgress * 1.5));
        const translateY = (1 - enterProgress) * 28;

        // Parallax offsets
        const parallaxBg = (progress - 0.5) * -35;
        const parallaxFg = (progress - 0.5) * 25;
        const parallaxMid = (progress - 0.5) * -15;

        // Apply CSS custom properties directly for 60FPS performance
        section.style.setProperty("--scroll-progress", progress.toFixed(3));
        section.style.setProperty("--scroll-enter", enterProgress.toFixed(3));
        section.style.setProperty("--reveal-opacity", opacity.toFixed(3));
        section.style.setProperty("--reveal-y", `${translateY.toFixed(1)}px`);
        section.style.setProperty("--parallax-bg", `${parallaxBg.toFixed(1)}px`);
        section.style.setProperty("--parallax-fg", `${parallaxFg.toFixed(1)}px`);
        section.style.setProperty("--parallax-mid", `${parallaxMid.toFixed(1)}px`);
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollMotion);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    
    // Initial call to set initial scroll values
    updateScrollMotion();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
};

export const LandingScrollManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useLandingScrollMotion();
  return <>{children}</>;
};

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyDomTranslatePatch } from "./lib/domTranslatePatch";
import { initMetaPixel, initScrollTracking, initTimeOnSite } from "./lib/metaPixel";
import { initClarity } from "./lib/clarity";
import { initFrictionDetectors, tagClaritySession, trackFunnelStep } from "./lib/funnelTracking";
import { captureAttribution } from "./lib/attribution";

// Must run BEFORE React renders — fixes browser-translation removeChild crash.
applyDomTranslatePatch();

// Capture marketing attribution as early as possible so every subsequent
// event (cart, checkout, funnel) carries the source ad info.
captureAttribution();

// Initialize Meta Pixel after first render to capture all visitors
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
    initClarity();
    initFrictionDetectors();
    // Tag the Clarity session a bit after init so the script has loaded
    setTimeout(tagClaritySession, 1500);
    // Track session landing once per session
    try {
      if (!sessionStorage.getItem('sleepzy_landing_tracked')) {
        sessionStorage.setItem('sleepzy_landing_tracked', '1');
        trackFunnelStep('session_landing', { step_value: window.location.pathname });
      }
    } catch { /* no-op */ }
  }, { timeout: 500 });
} else {
  setTimeout(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
    initClarity();
    initFrictionDetectors();
    setTimeout(tagClaritySession, 1500);
    try {
      if (!sessionStorage.getItem('sleepzy_landing_tracked')) {
        sessionStorage.setItem('sleepzy_landing_tracked', '1');
        trackFunnelStep('session_landing', { step_value: window.location.pathname });
      }
    } catch { /* no-op */ }
  }, 500);
}

createRoot(document.getElementById("root")!).render(<App />);

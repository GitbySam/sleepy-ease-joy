import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMetaPixel, initScrollTracking, initTimeOnSite } from "./lib/metaPixel";
import { initClarity } from "./lib/clarity";

// Initialize Meta Pixel after first render to capture all visitors
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
    initClarity();
  }, { timeout: 500 });
} else {
  setTimeout(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
    initClarity();
  }, 500);
}

createRoot(document.getElementById("root")!).render(<App />);

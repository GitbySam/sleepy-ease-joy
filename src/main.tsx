import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMetaPixel, initScrollTracking, initTimeOnSite } from "./lib/metaPixel";

// Initialize Meta Pixel after first render to capture all visitors
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
  }, { timeout: 500 });
} else {
  setTimeout(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
  }, 500);
}

createRoot(document.getElementById("root")!).render(<App />);

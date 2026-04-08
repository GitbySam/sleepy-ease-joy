import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMetaPixel, initScrollTracking, initTimeOnSite } from "./lib/metaPixel";

// Defer Meta Pixel initialization to avoid blocking TTI
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
  }, { timeout: 3000 });
} else {
  setTimeout(() => {
    initMetaPixel();
    initScrollTracking();
    initTimeOnSite();
  }, 3000);
}

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMetaPixel, initScrollTracking, initTimeOnSite } from "./lib/metaPixel";

// Initialize Meta Pixel
initMetaPixel();
initScrollTracking();
initTimeOnSite();

createRoot(document.getElementById("root")!).render(<App />);

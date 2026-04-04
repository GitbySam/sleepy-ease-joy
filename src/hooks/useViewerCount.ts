import { useState, useEffect } from "react";

/** Shared viewer count — same value across all components */
let globalCount = Math.floor(Math.random() * 30) + 25;
let listeners: Set<(n: number) => void> = new Set();
let intervalId: ReturnType<typeof setInterval> | null = null;

function startTicker() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    const delta = Math.floor(Math.random() * 7) - 3;
    globalCount = Math.max(18, Math.min(68, globalCount + delta));
    listeners.forEach((fn) => fn(globalCount));
  }, 4000);
}

export function useViewerCount() {
  const [count, setCount] = useState(globalCount);

  useEffect(() => {
    listeners.add(setCount);
    startTicker();
    return () => {
      listeners.delete(setCount);
      if (listeners.size === 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  }, []);

  return count;
}

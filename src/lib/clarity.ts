// Microsoft Clarity tracking utility
const CLARITY_PROJECT_ID = 'wk8deqcsz5';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

/** Initialize Microsoft Clarity (call once, idle). Skipped on /admin/* routes. */
export function initClarity() {
  if (typeof window === 'undefined') return;
  if (window.clarity) return;
  // Don't track admin sessions
  if (window.location.pathname.startsWith('/admin')) return;

  (function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode?.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
}

/** Tag the current Clarity session with a custom key/value (e.g. market, language). */
export function clarityTag(key: string, value: string) {
  if (typeof window === 'undefined' || !window.clarity) return;
  try {
    window.clarity('set', key, value);
  } catch {
    // no-op
  }
}

/** Mark a custom event in the Clarity session timeline. */
export function clarityEvent(name: string) {
  if (typeof window === 'undefined' || !window.clarity) return;
  try {
    window.clarity('event', name);
  } catch {
    // no-op
  }
}
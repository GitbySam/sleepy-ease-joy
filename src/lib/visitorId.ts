/**
 * Anonymous visitor ID stored in localStorage.
 * Used to stitch cart_events → checkout_events into a single funnel
 * without storing any personal data.
 */
const STORAGE_KEY = 'sleepzy_visitor_id';

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage blocked (private mode, etc.) — return ephemeral id
    return 'no_ls_' + Date.now();
  }
}
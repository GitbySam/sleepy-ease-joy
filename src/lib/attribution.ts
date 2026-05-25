/**
 * Marketing attribution.
 *
 * Captures UTM parameters + Meta click ID (fbclid) on the first landing of a
 * visitor, persists them in localStorage with a 30-day expiry, and exposes
 * `getAttribution()` so trackers can stamp every event with the source ad.
 *
 * First-touch wins: a non-expired attribution is never overwritten by a
 * subsequent visit. That's the standard model used by Meta/GA for cross-
 * session attribution.
 */

const STORAGE_KEY = 'sleepzy-attribution';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  landing_page: string | null;
  captured_at: number;
  expires_at: number;
}

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed?.expires_at || parsed.expires_at < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function detectReferrerSource(): { source: string | null; medium: string | null } {
  if (typeof document === 'undefined') return { source: null, medium: null };
  const ref = document.referrer || '';
  if (!ref) return { source: null, medium: null };
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (/(^|\.)facebook\.com$/.test(host) || /^l\.facebook\.com$/.test(host) || /^lm\.facebook\.com$/.test(host)) {
      return { source: 'facebook', medium: 'social' };
    }
    if (/(^|\.)instagram\.com$/.test(host) || /^l\.instagram\.com$/.test(host)) {
      return { source: 'instagram', medium: 'social' };
    }
    if (/(^|\.)google\./.test(host)) return { source: 'google', medium: 'organic' };
    if (/(^|\.)bing\.com$/.test(host)) return { source: 'bing', medium: 'organic' };
    if (/(^|\.)tiktok\.com$/.test(host)) return { source: 'tiktok', medium: 'social' };
    return { source: host.replace(/^www\./, ''), medium: 'referral' };
  } catch {
    return { source: null, medium: null };
  }
}

/** Call once on app bootstrap, before any tracking. */
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = readStored();
    const params = new URLSearchParams(window.location.search);

    const utm_source = params.get('utm_source');
    const utm_medium = params.get('utm_medium');
    const utm_campaign = params.get('utm_campaign');
    const utm_content = params.get('utm_content');
    const utm_term = params.get('utm_term');
    const fbclid = params.get('fbclid');

    const hasFreshSignal = !!(utm_source || utm_campaign || fbclid);

    // First-touch wins: keep the existing attribution if it's still valid
    // AND the new visit carries no fresh marketing signal.
    if (existing && !hasFreshSignal) return existing;

    // If we have a fresh signal, overwrite (paid click is more authoritative
    // than an older organic capture). If existing AND fresh, the fresh wins
    // because the user clicked an ad again right now.
    let source = utm_source;
    let medium = utm_medium;
    if (!source) {
      const detected = detectReferrerSource();
      source = detected.source;
      if (!medium) medium = detected.medium;
    }
    if (!medium && fbclid) medium = 'paid';

    const now = Date.now();
    const attribution: Attribution = {
      utm_source: source,
      utm_medium: medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
      landing_page: window.location.pathname || '/',
      captured_at: now,
      expires_at: now + TTL_MS,
    };

    // Only persist if at least one signal is non-null — avoid storing empty
    // objects for direct organic visitors (we'll just treat them as "direct").
    const hasAnySignal =
      attribution.utm_source ||
      attribution.utm_campaign ||
      attribution.fbclid ||
      attribution.utm_medium;
    if (hasAnySignal) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
      return attribution;
    }
    return existing;
  } catch {
    return null;
  }
}

/** Returns the active attribution (or null if none / expired). */
export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  return readStored();
}

/** Returns a flat object ready to spread into a Supabase insert row. */
export function getAttributionFields() {
  const a = getAttribution();
  return {
    utm_source: a?.utm_source ?? null,
    utm_medium: a?.utm_medium ?? null,
    utm_campaign: a?.utm_campaign ?? null,
    utm_content: a?.utm_content ?? null,
    utm_term: a?.utm_term ?? null,
    fbclid: a?.fbclid ?? null,
    landing_page: a?.landing_page ?? null,
  };
}
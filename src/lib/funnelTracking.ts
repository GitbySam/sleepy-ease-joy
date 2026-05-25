/**
 * Funnel & friction tracking library.
 *
 * Goal: capture every step of the purchase journey + every frustration
 * signal so we can identify exactly where visitors drop off and what
 * blocks them.
 *
 * All tracking is anonymous (visitor_id only) and fire-and-forget.
 * Errors here NEVER propagate to the UI.
 */
import { supabase } from '@/integrations/supabase/client';
import { getVisitorId } from '@/lib/visitorId';
import { clarityEvent, clarityTag } from '@/lib/clarity';
import { getAttributionFields } from '@/lib/attribution';

export type FunnelStep =
  | 'session_landing'
  | 'view_product'
  | 'select_color'
  | 'select_bundle'
  | 'add_to_cart'
  | 'open_cart'
  | 'click_checkout'
  | 'checkout_opened'
  | 'checkout_popup_blocked'
  | 'return_from_checkout';

export type FrictionType =
  | 'rage_click'
  | 'dead_click'
  | 'js_error'
  | 'shopify_error'
  | 'product_load_error'
  | 'checkout_error'
  | 'slow_response'
  | 'hesitation_abandon';

function getDevice(): string {
  if (typeof window === 'undefined') return 'unknown';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getCommonContext() {
  if (typeof window === 'undefined') {
    return {
      visitor_id: 'ssr',
      page_path: '',
      referrer: null as string | null,
      market: null as string | null,
      language: null as string | null,
      device: 'unknown',
      user_agent: '',
    };
  }
  let market: string | null = null;
  let language: string | null = null;
  try {
    market = localStorage.getItem('sleepzy-market');
    language = localStorage.getItem('sleepzy-language');
  } catch {
    /* localStorage blocked */
  }
  return {
    visitor_id: getVisitorId(),
    page_path: window.location.pathname,
    referrer: document.referrer || null,
    market,
    language,
    device: getDevice(),
    user_agent: navigator.userAgent,
    ...getAttributionFields(),
  };
}

/** Track a funnel step. Fire-and-forget. */
export function trackFunnelStep(
  step: FunnelStep,
  data: { step_value?: string; value?: number; currency?: string; metadata?: Record<string, unknown>; beacon?: boolean } = {}
) {
  if (typeof window === 'undefined') return;
  // Skip admin sessions
  if (window.location.pathname.startsWith('/admin')) return;

  try {
    const ctx = getCommonContext();
    const row = {
      ...ctx,
      step,
      step_value: data.step_value ?? null,
      value: data.value ?? null,
      currency: data.currency ?? null,
      metadata: (data.metadata ?? null) as never,
    };

    // For critical pre-navigation events (checkout), use sendBeacon so the
    // request survives the immediate tab/page change. Beacon hits the REST
    // endpoint directly with the anon key.
    let beaconSent = false;
    if (data.beacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/funnel_events`;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        // sendBeacon requires a Blob with the right MIME; we also need the
        // apikey, which Beacon can't send as a header. Workaround: encode
        // it in the URL via the `apikey` query param — Supabase accepts it.
        const blob = new Blob([JSON.stringify(row)], { type: 'application/json' });
        const beaconUrl = `${url}?apikey=${encodeURIComponent(apiKey)}`;
        beaconSent = navigator.sendBeacon(beaconUrl, blob);
      } catch {
        beaconSent = false;
      }
    }

    if (!beaconSent) {
      supabase
        .from('funnel_events')
        .insert([row])
        .then(({ error }) => {
          if (error) console.warn('[funnel] insert failed', error.message);
        });
    }

    // Also tag the Clarity session timeline
    clarityEvent(`funnel_${step}`);
  } catch (e) {
    console.warn('[funnel] track error', e);
  }
}

/** Track a friction signal. Fire-and-forget. */
export function trackFriction(
  type: FrictionType,
  data: {
    severity?: 'info' | 'warn' | 'error';
    message?: string;
    element?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;

  try {
    const { referrer: _r, ...ctx } = getCommonContext();
    void _r;
    supabase
      .from('friction_events')
      .insert([{
        ...ctx,
        type,
        severity: data.severity ?? 'warn',
        message: data.message ?? null,
        element: data.element ?? null,
        metadata: (data.metadata ?? null) as never,
      }])
      .then(({ error }) => {
        if (error) console.warn('[friction] insert failed', error.message);
      });

    clarityEvent(`friction_${type}`);
  } catch (e) {
    console.warn('[friction] track error', e);
  }
}

/* ─────────────────────────────────────────────────────────────
 *  Auto-detection setup — call once at app bootstrap.
 *  Detects: rage clicks, dead clicks, JS errors, slow responses.
 * ───────────────────────────────────────────────────────────── */

function describeElement(el: Element | null): string {
  if (!el) return 'unknown';
  const tag = el.tagName.toLowerCase();
  const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : '';
  const cls =
    typeof (el as HTMLElement).className === 'string' && (el as HTMLElement).className
      ? '.' + (el as HTMLElement).className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
  const text = (el.textContent || '').trim().slice(0, 40);
  const aria = el.getAttribute('aria-label');
  return `${tag}${id}${cls}${aria ? `[aria-label="${aria}"]` : ''}${text ? ` "${text}"` : ''}`;
}

export function initFrictionDetectors() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;

  /* ── Rage click detector: 3+ clicks within 800ms in same area ── */
  const recentClicks: Array<{ x: number; y: number; t: number; el: Element | null }> = [];
  document.addEventListener(
    'click',
    (e) => {
      const now = Date.now();
      recentClicks.push({ x: e.clientX, y: e.clientY, t: now, el: e.target as Element });
      // keep last 5 within 1s
      while (recentClicks.length > 0 && now - recentClicks[0].t > 1000) recentClicks.shift();
      if (recentClicks.length >= 3) {
        // check proximity
        const first = recentClicks[0];
        const last = recentClicks[recentClicks.length - 1];
        if (Math.hypot(last.x - first.x, last.y - first.y) < 60) {
          trackFriction('rage_click', {
            severity: 'warn',
            element: describeElement(last.el),
            metadata: { clicks: recentClicks.length, durationMs: last.t - first.t },
          });
          recentClicks.length = 0;
        }
      }
    },
    { passive: true, capture: true }
  );

  /* ── Dead click detector: click on non-interactive elements ── */
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null;
      if (!target) return;
      // walk up to find interactive ancestor
      let cursor: Element | null = target;
      const interactive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL', 'SUMMARY'];
      let found = false;
      for (let i = 0; cursor && i < 6; i++) {
        if (
          interactive.includes(cursor.tagName) ||
          (cursor as HTMLElement).onclick !== null ||
          cursor.getAttribute('role') === 'button' ||
          cursor.getAttribute('tabindex') !== null
        ) {
          found = true;
          break;
        }
        cursor = cursor.parentElement;
      }
      if (!found) {
        // Looks like a dead click — but ignore plain text/whitespace
        const tagName = target.tagName;
        if (['HTML', 'BODY', 'MAIN', 'SECTION', 'DIV', 'P', 'SPAN', 'IMG', 'H1', 'H2', 'H3'].includes(tagName)) {
          // Only flag images and headings (more likely user expected them clickable)
          if (['IMG', 'H1', 'H2', 'H3'].includes(tagName)) {
            trackFriction('dead_click', {
              severity: 'info',
              element: describeElement(target),
            });
          }
        }
      }
    },
    { passive: true, capture: true }
  );

  /* ── Global JS error capture ── */
  window.addEventListener('error', (e) => {
    trackFriction('js_error', {
      severity: 'error',
      message: e.message?.slice(0, 500) || 'unknown error',
      element: e.filename ? `${e.filename}:${e.lineno}` : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    trackFriction('js_error', {
      severity: 'error',
      message: `Unhandled promise: ${reason?.slice(0, 500)}`,
    });
  });

  /* ── Slow response monitor: hooks into fetch ── */
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url || '';
    const start = performance.now();
    try {
      const res = await origFetch(...args);
      const duration = performance.now() - start;
      // Flag any Shopify or Supabase call > 3s
      if (duration > 3000 && /(myshopify\.com|supabase\.co)/.test(url)) {
        trackFriction('slow_response', {
          severity: 'warn',
          message: `${Math.round(duration)}ms`,
          element: url.split('?')[0],
        });
      }
      // 5xx errors on Shopify
      if (!res.ok && res.status >= 500 && /(myshopify\.com)/.test(url)) {
        trackFriction('shopify_error', {
          severity: 'error',
          message: `HTTP ${res.status}`,
          element: url.split('?')[0],
        });
      }
      return res;
    } catch (err) {
      const duration = performance.now() - start;
      if (/(myshopify\.com)/.test(url)) {
        trackFriction('shopify_error', {
          severity: 'error',
          message: err instanceof Error ? err.message : 'fetch failed',
          element: url.split('?')[0],
          metadata: { durationMs: Math.round(duration) },
        });
      }
      throw err;
    }
  };
}

/** Tag the Clarity session with marketing/segmentation context. */
export function tagClaritySession() {
  if (typeof window === 'undefined') return;
  try {
    const market = localStorage.getItem('sleepzy-market');
    const language = localStorage.getItem('sleepzy-language');
    if (market) clarityTag('market', market);
    if (language) clarityTag('language', language);
    clarityTag('device', getDevice());
    clarityTag('visitor_id', getVisitorId());
  } catch {
    /* no-op */
  }
}
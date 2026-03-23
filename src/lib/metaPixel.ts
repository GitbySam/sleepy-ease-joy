// Meta Pixel (Facebook Pixel) tracking utility
const PIXEL_ID = '2093867758129616';

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

/** Initialize the Meta Pixel (call once on app load) */
export function initMetaPixel() {
  if (typeof window === 'undefined' || window.fbq) return;

  // Facebook Pixel base code
  const f = window;
  const b = document;
  const n = function (...args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    (n as any).callMethod ? (n as any).callMethod.apply(n, args) : (n as any).queue.push(args);
  };
  (n as any).push = n;
  (n as any).loaded = true;
  (n as any).version = '2.0';
  (n as any).queue = [];
  f.fbq = n;
  f._fbq = n;

  const s = b.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const firstScript = b.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(s, firstScript);

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

/** Track a page view (call on route change) */
export function trackPageView() {
  if (!window.fbq) return;
  window.fbq('track', 'PageView');
}

/** Track product view */
export function trackViewContent(params: {
  contentName: string;
  contentId: string;
  value?: number;
  currency?: string;
}) {
  if (!window.fbq) return;
  window.fbq('track', 'ViewContent', {
    content_name: params.contentName,
    content_ids: [params.contentId],
    content_type: 'product',
    value: params.value ?? 0,
    currency: params.currency ?? 'EUR',
  });
}

/** Track add to cart */
export function trackAddToCart(params: {
  contentName: string;
  contentId: string;
  value: number;
  currency?: string;
  quantity?: number;
}) {
  if (!window.fbq) return;
  window.fbq('track', 'AddToCart', {
    content_name: params.contentName,
    content_ids: [params.contentId],
    content_type: 'product',
    value: params.value,
    currency: params.currency ?? 'EUR',
    num_items: params.quantity ?? 1,
  });
}

/** Track initiate checkout */
export function trackInitiateCheckout(params: {
  value: number;
  currency?: string;
  numItems: number;
}) {
  if (!window.fbq) return;
  window.fbq('track', 'InitiateCheckout', {
    value: params.value,
    currency: params.currency ?? 'EUR',
    num_items: params.numItems,
  });
}

/** Track scroll depth milestones */
export function initScrollTracking() {
  if (typeof window === 'undefined') return;
  const milestones = [25, 50, 75, 100];
  const reached = new Set<number>();

  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const percent = Math.round((scrollTop / docHeight) * 100);

    milestones.forEach((m) => {
      if (percent >= m && !reached.has(m)) {
        reached.add(m);
        window.fbq?.('trackCustom', 'ScrollDepth', { percent: m });
      }
    });
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}

/** Track time on site */
export function initTimeOnSite() {
  if (typeof window === 'undefined') return;
  const milestones = [30, 60, 120, 300]; // seconds
  const reached = new Set<number>();
  const start = Date.now();

  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    milestones.forEach((m) => {
      if (elapsed >= m && !reached.has(m)) {
        reached.add(m);
        window.fbq?.('trackCustom', 'TimeOnSite', { seconds: m });
      }
    });
    if (reached.size === milestones.length) clearInterval(interval);
  }, 5000);

  return () => clearInterval(interval);
}

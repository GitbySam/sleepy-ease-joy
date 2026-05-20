import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';

export function useCartSync() {
  const syncCart = useCartStore(state => state.syncCart);
  const checkoutUrl = useCartStore(state => state.checkoutUrl);

  useEffect(() => {
    syncCart();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncCart();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncCart]);

  // Pre-warm the checkout page as soon as we have a checkoutUrl, so clicking
  // "Checkout" feels instant. Uses <link rel="prefetch"> which the browser
  // fetches at low priority during idle time.
  useEffect(() => {
    if (!checkoutUrl) return;
    let link: HTMLLinkElement | null = null;
    const schedule = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number };
      if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(cb);
      else setTimeout(cb, 300);
    };
    schedule(() => {
      try {
        link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'document';
        link.href = checkoutUrl;
        document.head.appendChild(link);
      } catch {}
    });
    return () => {
      if (link && link.parentNode) link.parentNode.removeChild(link);
    };
  }, [checkoutUrl]);
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { getVisitorId } from '@/lib/visitorId';
import { trackFriction } from '@/lib/funnelTracking';
import { getAttributionFields } from '@/lib/attribution';
import {
  type CartItemData,
  type ShopifyProduct,
  type CountryCode,
  createShopifyCart,
  addLineToShopifyCart,
  updateShopifyCartLine,
  removeLineFromShopifyCart,
  storefrontApiRequest,
  CART_QUERY,
  attachAttributionToCart,
} from '@/lib/shopify';
import { getAttribution } from '@/lib/attribution';

export type { CartItemData, ShopifyProduct };

interface CartStore {
  items: CartItemData[];
  cartId: string | null;
  checkoutUrl: string | null;
  cartCountry: CountryCode | null;
  isLoading: boolean;
  isSyncing: boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  isRedirecting: boolean;
  setRedirecting: (v: boolean) => void;
  pendingProductRedirect: { color?: string } | null;
  consumePendingRedirect: () => { color?: string } | null;
  addItem: (item: Omit<CartItemData, 'lineId'>, country?: CountryCode) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number, bundleLabel?: string) => Promise<void>;
  removeItem: (variantId: string, bundleLabel?: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      cartCountry: null,
      isLoading: false,
      isSyncing: false,
      isDrawerOpen: false,
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      isRedirecting: false,
      setRedirecting: (v) => set({ isRedirecting: v }),
      pendingProductRedirect: null,
      consumePendingRedirect: () => {
        const v = get().pendingProductRedirect;
        if (v) set({ pendingProductRedirect: null });
        return v;
      },

      addItem: async (item, country) => {
        const requestedCountry: CountryCode = country ?? 'CA';
        // If the active market changed since the cart was created, reset the cart
        // so Shopify creates a new checkout in the correct currency/country.
        const prevCountry = get().cartCountry;
        if (prevCountry && prevCountry !== requestedCountry) {
          get().clearCart();
        }
        const { items, cartId, clearCart } = get();
        const itemKey = `${item.variantId}__${item.bundleLabel || 'single'}`;
        const existingItem = items.find(i => `${i.variantId}__${i.bundleLabel || 'single'}` === itemKey);

        set({ isLoading: true });
        try {
          // Track add-to-cart event
          const path = typeof window !== 'undefined' ? window.location.pathname : '';
          const source = path.startsWith('/product') ? 'product' : path === '/' || path === '' ? 'landing' : 'other';
          supabase.from('cart_events').insert([{
            variant_id: item.variantId,
            bundle_label: item.bundleLabel || 'single',
            quantity: item.quantity,
            price: typeof item.bundlePrice === 'number' ? item.bundlePrice : (typeof item.price === 'number' ? item.price : null),
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
            source,
            visitor_id: getVisitorId(),
            ...getAttributionFields(),
          }]).then(); // fire-and-forget

          if (!cartId) {
            const result = await createShopifyCart({ ...item, lineId: null }, requestedCountry);
            if (result) {
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                cartCountry: requestedCountry,
                items: [{ ...item, lineId: result.lineId }],
              });
              // Fire-and-forget: attach marketing attribution so Shopify Order
              // carries it through to the post-purchase webhook (Meta CAPI).
              try {
                const a = getAttribution();
                attachAttributionToCart(result.cartId, {
                  visitor_id: getVisitorId(),
                  utm_source: a?.utm_source,
                  utm_medium: a?.utm_medium,
                  utm_campaign: a?.utm_campaign,
                  utm_content: a?.utm_content,
                  utm_term: a?.utm_term,
                  fbclid: a?.fbclid,
                  landing_page: a?.landing_page,
                  fbp: (document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/) || [])[1] || null,
                  fbc: (document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/) || [])[1] || null,
                  user_agent: navigator.userAgent,
                });
              } catch { /* never block checkout */ }
            }
          } else if (existingItem) {
            const newQuantity = existingItem.quantity + item.quantity;
            if (!existingItem.lineId) return;
            const result = await updateShopifyCartLine(cartId, existingItem.lineId, newQuantity);
            if (result.success) {
              const currentItems = get().items;
              set({ items: currentItems.map(i => {
                if (`${i.variantId}__${i.bundleLabel || 'single'}` === itemKey) {
                  const newBundlePrice = i.bundlePrice && i.bundleUnitSize
                    ? (i.bundlePrice / i.quantity) * newQuantity
                    : undefined;
                  return { ...i, quantity: newQuantity, ...(newBundlePrice !== undefined ? { bundlePrice: newBundlePrice } : {}) };
                }
                return i;
              }) });
            } else if (result.cartNotFound) {
              clearCart();
            }
          } else {
            const result = await addLineToShopifyCart(cartId, { ...item, lineId: null });
            if (result.success) {
              const currentItems = get().items;
              set({ items: [...currentItems, { ...item, lineId: result.lineId ?? null }] });
            } else if (result.cartNotFound) {
              clearCart();
            }
          }
          // Mark a pending redirect to /product if the ATC was triggered
          // from anywhere other than the product page itself.
          try {
            const path = typeof window !== 'undefined' ? window.location.pathname : '';
            if (!path.startsWith('/product')) {
              const colorOpt = item.selectedOptions?.find(o => o.name?.toLowerCase() === 'color')?.value;
              set({ pendingProductRedirect: { color: colorOpt } });
            }
          } catch { /* noop */ }
        } catch (error) {
          console.error('Failed to add item:', error);
          trackFriction('shopify_error', {
            severity: 'error',
            message: error instanceof Error ? error.message : 'addItem failed',
            element: 'cartStore.addItem',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity, bundleLabel) => {
        if (quantity <= 0) {
          await get().removeItem(variantId, bundleLabel);
          return;
        }

        const { items, cartId, clearCart } = get();
        const itemKey = `${variantId}__${bundleLabel || 'single'}`;
        const item = items.find(i => `${i.variantId}__${i.bundleLabel || 'single'}` === itemKey);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await updateShopifyCartLine(cartId, item.lineId, quantity);
          if (result.success) {
            const currentItems = get().items;
            set({ items: currentItems.map(i => {
              if (`${i.variantId}__${i.bundleLabel || 'single'}` !== itemKey) return i;
              const newBundlePrice = i.bundlePrice && i.quantity > 0
                ? (i.bundlePrice / i.quantity) * quantity
                : undefined;
              return { ...i, quantity, ...(newBundlePrice !== undefined ? { bundlePrice: newBundlePrice } : {}) };
            }) });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error('Failed to update quantity:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId, bundleLabel) => {
        const { items, cartId, clearCart } = get();
        const itemKey = `${variantId}__${bundleLabel || 'single'}`;
        const item = items.find(i => `${i.variantId}__${i.bundleLabel || 'single'}` === itemKey);
        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });
        try {
          const result = await removeLineFromShopifyCart(cartId, item.lineId);
          if (result.success) {
            const currentItems = get().items;
            const newItems = currentItems.filter(i => `${i.variantId}__${i.bundleLabel || 'single'}` !== itemKey);
            newItems.length === 0 ? clearCart() : set({ items: newItems });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error('Failed to remove item:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null, cartCountry: null }),
      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId, isSyncing, clearCart } = get();
        if (!cartId || isSyncing) return;

        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = data?.data?.cart;
          if (!cart || cart.totalQuantity === 0) clearCart();
        } catch (error) {
          console.error('Failed to sync cart:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'shopify-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, cartId: state.cartId, checkoutUrl: state.checkoutUrl, cartCountry: state.cartCountry }),
    }
  )
);

// Reset in-memory cart when the market (country) changes
if (typeof window !== "undefined") {
  window.addEventListener("sleepzy:cart-reset", () => {
    useCartStore.getState().clearCart();
  });
}

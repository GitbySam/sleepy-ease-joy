import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import {
  type CartItemData,
  type ShopifyProduct,
  createShopifyCart,
  addLineToShopifyCart,
  updateShopifyCartLine,
  removeLineFromShopifyCart,
  storefrontApiRequest,
  CART_QUERY,
} from '@/lib/shopify';

export type { CartItemData, ShopifyProduct };

interface CartStore {
  items: CartItemData[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItemData, 'lineId'>) => Promise<void>;
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
      isLoading: false,
      isSyncing: false,
      isDrawerOpen: false,
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),

      addItem: async (item) => {
        const { items, cartId, clearCart } = get();
        const itemKey = `${item.variantId}__${item.bundleLabel || 'single'}`;
        const existingItem = items.find(i => `${i.variantId}__${i.bundleLabel || 'single'}` === itemKey);

        set({ isLoading: true });
        try {
          // Track add-to-cart event
          supabase.from('cart_events').insert([{
            variant_id: item.variantId,
            bundle_label: item.bundleLabel || 'single',
            quantity: item.quantity,
            price: item.bundlePrice ?? item.price ?? null,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          }]).then(); // fire-and-forget

          if (!cartId) {
            const result = await createShopifyCart({ ...item, lineId: null });
            if (result) {
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                items: [{ ...item, lineId: result.lineId }],
              });
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
        } catch (error) {
          console.error('Failed to add item:', error);
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
            set({ items: currentItems.map(i => `${i.variantId}__${i.bundleLabel || 'single'}` === itemKey ? { ...i, quantity } : i) });
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

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
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
      partialize: (state) => ({ items: state.items, cartId: state.cartId, checkoutUrl: state.checkoutUrl }),
    }
  )
);

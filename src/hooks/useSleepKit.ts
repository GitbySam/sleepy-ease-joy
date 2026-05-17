import { useEffect, useState } from "react";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";

/**
 * Canada-only Sleep Kit add-on (mask + earplugs).
 * Price is intentionally hard-coded on the frontend so it can be
 * tweaked quickly after launch without touching Shopify.
 */
export const SLEEP_KIT_PRICE_CAD = 16.95;
export const SLEEP_KIT_SKU = "SLEEPENZY-SLEEPKIT-CA";

export interface SleepKitVariant {
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  imageUrl: string | null;
  price: { amount: string; currencyCode: string };
  selectedOptions: Array<{ name: string; value: string }>;
}

export function useSleepKit(country: string): SleepKitVariant | null {
  const [variant, setVariant] = useState<SleepKitVariant | null>(null);

  useEffect(() => {
    if (country !== "CA") {
      setVariant(null);
      return;
    }
    let cancelled = false;
    fetchProducts(5, `sku:${SLEEP_KIT_SKU}`, "CA")
      .then((products) => {
        if (cancelled) return;
        for (const p of products) {
          const v = p.node.variants.edges.find(
            (e) => (e.node as { sku?: string | null }).sku === SLEEP_KIT_SKU
          );
          if (v) {
            setVariant({
              product: p,
              variantId: v.node.id,
              variantTitle: v.node.title,
              imageUrl: p.node.images.edges[0]?.node.url ?? null,
              price: v.node.price,
              selectedOptions: v.node.selectedOptions || [],
            });
            return;
          }
        }
        // Not found — silent degradation per spec
        console.warn(`[SleepKit] variant with sku=${SLEEP_KIT_SKU} not found`);
        setVariant(null);
      })
      .catch((err) => {
        console.warn("[SleepKit] failed to fetch variant", err);
        setVariant(null);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  return variant;
}
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts } from "@/lib/shopify";
import { trackAddToCart } from "@/lib/metaPixel";
import { trackFunnelStep, trackFriction } from "@/lib/funnelTracking";
import { toast } from "sonner";

const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();
  const { country, currency, prices, formatPrice } = useMarket();
  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // 1. Fetch the pillow product
      const pillowList = await fetchProducts(1, undefined, country);
      const pillow = pillowList[0];
      if (!pillow) {
        toast.error(t("product.addedToCart") ? "Product unavailable" : "Product unavailable");
        return;
      }

      // 2. Find the Single + Grey variant
      const greyVariant = pillow.node.variants.edges.find((v) => {
        const opts = v.node.selectedOptions || [];
        const isSingle = opts.some((o) => o.value === "Single");
        const isGrey = opts.some(
          (o) => o.name === "Color" && (o.value === "Grey" || o.value === "Gray"),
        );
        return isSingle && isGrey;
      })?.node;

      if (!greyVariant) {
        trackFriction("checkout_error", {
          severity: "error",
          message: "Sticky CTA: Single Grey variant not found",
        });
        toast.error("Variant unavailable");
        return;
      }

      // 3. Add Single Grey pillow
      await addItem(
        {
          product: pillow,
          variantId: greyVariant.id,
          variantTitle: greyVariant.title,
          price: greyVariant.price,
          quantity: 1,
          selectedOptions: greyVariant.selectedOptions || [],
          bundleLabel: "SOLO TRAVELERS",
          bundlePrice: prices.single,
          bundleUnitSize: 1,
        },
        country,
      );

      // 4. Tracking
      trackAddToCart({
        contentName: "1 Sleep&zy (Grey)",
        contentId: greyVariant.id,
        value: prices.single,
        currency,
        quantity: 1,
      });
      trackFunnelStep("add_to_cart", {
        step_value: "sticky_cta_single_grey",
        value: prices.single,
        currency,
      });

      toast.success(t("product.addedToCart") || "Added to cart", {
        position: "top-center",
      });

      // 5. Open drawer
      setDrawerOpen(true);
    } catch (e) {
      console.error("Sticky CTA ATC failed", e);
      trackFriction("shopify_error", {
        severity: "error",
        message: e instanceof Error ? e.message : "Sticky ATC failed",
        element: "StickyMobileCTA",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-card/95 backdrop-blur-md border-t border-border px-4 pt-2 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={handleClick}
              aria-busy={busy}
              className="w-full bg-black text-primary-foreground text-center py-2.5 rounded-full font-bold shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center gap-0.5 cursor-pointer leading-tight"
            >
              <span className="flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                <span className="text-[13px] uppercase tracking-wide">{t("sticky.cta")}</span>
              </span>
              <span className="text-[11px] font-normal whitespace-nowrap">
                <span className="line-through opacity-60">{formatPrice(prices.oldSingle)}</span>{" "}
                <span className="font-bold">{formatPrice(prices.single)}</span>
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyMobileCTA;

import { useState } from "react";
import { fetchProducts } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useMarket } from "@/i18n/MarketContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { trackAddToCart } from "@/lib/metaPixel";
import { toast } from "sonner";

export const useQuickAdd = () => {
  const { addItem, setDrawerOpen } = useCartStore();
  const { country, currency, prices } = useMarket();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const quickAdd = async (color: string = "Grey") => {
    if (loading) return;
    setLoading(true);
    try {
      const all = await fetchProducts(20, undefined, country);
      const product = all.find((p) => {
        const x = `${p.node.title} ${p.node.handle}`.toLowerCase();
        return !/(kit|bundle)/.test(x);
      });
      if (!product) {
        toast.error("Product unavailable");
        return;
      }
      const coloredVariants = product.node.variants.edges.filter((v) =>
        v.node.selectedOptions?.some((o) => o.name === "Color" && o.value === color)
      );
      const variant =
        coloredVariants.find((v) => v.node.selectedOptions?.some((o) => o.value === "Single"))?.node ||
        coloredVariants[0]?.node;
      if (!variant) {
        toast.error("Variant not available");
        return;
      }
      await addItem(
        {
          product,
          variantId: variant.id,
          variantTitle: variant.title,
          price: variant.price,
          quantity: 1,
          selectedOptions: variant.selectedOptions || [],
          bundleLabel: "1 Sleep&zy",
          bundlePrice: prices.single,
          bundleUnitSize: 1,
        },
        country
      );
      trackAddToCart({
        contentName: `1 Sleep&zy (${color})`,
        contentId: variant.id,
        value: prices.single,
        currency,
        quantity: 1,
      });
      toast.success(`1 Sleep&zy (${color}) ${t("product.addedToCart")}`, { position: "top-center" });
      setTimeout(() => setDrawerOpen(true), 500);
    } finally {
      setLoading(false);
    }
  };

  return { quickAdd, loading };
};
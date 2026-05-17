import { motion } from "framer-motion";
import { Loader2, Package } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { useCartStore } from "@/stores/cartStore";
import { useSleepKit, SLEEP_KIT_PRICE_CAD } from "@/hooks/useSleepKit";
import { type ShopifyProduct } from "@/lib/shopify";
import { trackAddToCart } from "@/lib/metaPixel";
import { trackFunnelStep } from "@/lib/funnelTracking";
import { toast } from "sonner";

interface Props {
  product: ShopifyProduct | null;
  selectedColor: string;
}

// Bundle prices are intentionally hard-coded so they stay easy to tune
// independently from Shopify variant prices.
const BUNDLE_PRICES_CAD = {
  solo:   { bundle: 42.95,  alaCarte: 29.95 + 16.95 * 1 },
  duo:    { bundle: 84.95,  alaCarte: 59.90 + 16.95 * 2 },
  family: { bundle: 104.95, alaCarte: 64.95 + 16.95 * 3 },
};

const PreBuiltBundles = ({ product, selectedColor }: Props) => {
  const { t } = useLanguage();
  const { country, currency, formatPrice } = useMarket();
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const sleepKit = useSleepKit(country);

  if (country !== "CA" || !product || !sleepKit) return null;

  const variants = product.node.variants.edges.filter((v) =>
    v.node.selectedOptions?.some((o) => o.name === "Color" && o.value === selectedColor)
  );
  const findPackVariant = (packValue: string) =>
    variants.find((v) => v.node.selectedOptions?.some((o) => o.value === packValue))?.node;

  const items = [
    {
      key: "solo" as const,
      title: t("preBundles.solo"),
      pillows: 1,
      kits: 1,
      packValue: "Single",
      ...BUNDLE_PRICES_CAD.solo,
    },
    {
      key: "duo" as const,
      title: t("preBundles.duo"),
      pillows: 2,
      kits: 2,
      packValue: "Duo Pack",
      ...BUNDLE_PRICES_CAD.duo,
    },
    {
      key: "family" as const,
      title: t("preBundles.family"),
      pillows: 3,
      kits: 3,
      packValue: "Family Pack",
      ...BUNDLE_PRICES_CAD.family,
    },
  ];

  const handleAdd = async (item: (typeof items)[number]) => {
    const packVariant = findPackVariant(item.packValue);
    if (!packVariant) {
      console.warn("[PreBundles] no pack variant for", item.packValue);
      return;
    }

    // Bundle discount applied as a price override on the pillow line.
    const pillowLinePrice = item.bundle - item.kits * SLEEP_KIT_PRICE_CAD;

    await addItem(
      {
        product,
        variantId: packVariant.id,
        variantTitle: packVariant.title,
        price: packVariant.price,
        quantity: 1,
        selectedOptions: packVariant.selectedOptions || [],
        bundleLabel: item.title,
        bundlePrice: pillowLinePrice,
        bundleUnitSize: 1,
      },
      country,
    );

    await addItem(
      {
        product: sleepKit.product,
        variantId: sleepKit.variantId,
        variantTitle: sleepKit.variantTitle,
        price: sleepKit.price,
        quantity: item.kits,
        selectedOptions: sleepKit.selectedOptions,
        bundleLabel: "Sleep Kit",
        bundlePrice: item.kits * SLEEP_KIT_PRICE_CAD,
        bundleUnitSize: 1,
      },
      country,
    );

    trackAddToCart({
      contentName: item.title,
      contentId: packVariant.id,
      value: item.bundle,
      currency,
      quantity: item.pillows + item.kits,
    });
    trackFunnelStep("add_to_cart", {
      step_value: item.title,
      value: item.bundle,
      currency,
    });

    toast.success(`${item.title} ${t("product.addedToCart")}`, { position: "top-center" });
    setDrawerOpen(true);
  };

  return (
    <section className="mt-10" data-clarity-unmask="true">
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground">
          {t("preBundles.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("preBundles.subtitle")}</p>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const savings = item.alaCarte - item.bundle;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="relative rounded-2xl border-2 border-border hover:border-gold/40 bg-card overflow-hidden transition-colors"
            >
              <span className="absolute top-3 right-3 bg-gold text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full tabular-nums z-10">
                {t("preBundles.save")} {formatPrice(savings)}
              </span>

              <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-dark-blue/90 to-dark-blue flex items-center justify-center">
                  <Package size={32} className="text-gold" />
                </div>

                <div className="flex-1 min-w-0 pr-16 sm:pr-20">
                  <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("preBundles.includes")}: {item.pillows}{" "}
                    {item.pillows > 1 ? t("preBundles.pillows") : t("preBundles.pillow")}
                    {" + "}
                    {item.kits} {item.kits > 1 ? t("preBundles.kits") : t("preBundles.kit")}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2" data-clarity-unmask="true">
                    <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
                      {formatPrice(item.bundle)}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground line-through tabular-nums">
                      {formatPrice(item.alaCarte)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAdd(item)}
                disabled={isLoading}
                className="w-full bg-dark-blue text-primary-foreground py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-dark-blue/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("preBundles.add")}
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PreBuiltBundles;
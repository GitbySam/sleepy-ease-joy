import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { trackAddToCart } from "@/lib/metaPixel";
import { trackFunnelStep } from "@/lib/funnelTracking";
import { toast } from "sonner";
import pillowGrey from "@/assets/product-pillow-grey-new.webp";
import pillowBlack from "@/assets/product-pillow-black.webp";
import pillowRed from "@/assets/product-pillow-red.webp";

const FALLBACK_IMAGES: Record<string, string> = {
  Grey: pillowGrey,
  GREY: pillowGrey,
  Black: pillowBlack,
  BLACK: pillowBlack,
  Red: pillowRed,
  RED: pillowRed,
};

type BundleKey = "solo" | "duo" | "family";

function classify(handle: string, title: string): BundleKey | null {
  const s = `${handle} ${title}`.toLowerCase();
  if (s.includes("solo")) return "solo";
  if (s.includes("family")) return "family";
  if (s.includes("duo")) return "duo";
  return null;
}

interface SleepBundlesProps {
  compact?: boolean;
}

const SleepBundles = ({ compact = false }: SleepBundlesProps) => {
  const { t } = useLanguage();
  const { country, currency, formatPrice } = useMarket();
  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const isLoading = useCartStore((s) => s.isLoading);
  const [products, setProducts] = useState<Record<BundleKey, ShopifyProduct | null>>({
    solo: null,
    duo: null,
    family: null,
  });
  const [loading, setLoading] = useState(true);
  const [soloColor, setSoloColor] = useState<string>("GREY");
  const [adding, setAdding] = useState<BundleKey | null>(null);

  useEffect(() => {
    fetchProducts(10, `product_type:"Sleep Kit Bundle"`, country)
      .then((list) => {
        const next: Record<BundleKey, ShopifyProduct | null> = { solo: null, duo: null, family: null };
        list.forEach((p) => {
          const k = classify(p.node.handle, p.node.title);
          if (k && !next[k]) next[k] = p;
        });
        setProducts(next);
      })
      .catch((e) => console.error("Sleep Bundles fetch error", e))
      .finally(() => setLoading(false));
  }, [country]);

  const ORDER: Array<{ key: BundleKey; pillowCount: number; tagLabel: string; tagColor: string }> = [
    { key: "solo", pillowCount: 1, tagLabel: t("bundles.tag.solo"), tagColor: "bg-dark-blue" },
    { key: "duo", pillowCount: 2, tagLabel: t("bundles.tag.duo"), tagColor: "bg-gold" },
    { key: "family", pillowCount: 3, tagLabel: t("bundles.tag.family"), tagColor: "bg-destructive" },
  ];

  const handleAdd = async (key: BundleKey, product: ShopifyProduct) => {
    const variants = product.node.variants.edges;
    if (variants.length === 0) {
      toast.error("Variant unavailable");
      return;
    }
    let chosen = variants[0].node;
    if (key === "solo") {
      const match = variants.find((v) =>
        v.node.selectedOptions?.some((o) => o.name === "Color" && o.value.toUpperCase() === soloColor)
      );
      if (match) chosen = match.node;
    }

    setAdding(key);
    try {
      const price = parseFloat(chosen.price.amount);
      await addItem(
        {
          product,
          variantId: chosen.id,
          variantTitle: chosen.title,
          price: chosen.price,
          quantity: 1,
          selectedOptions: chosen.selectedOptions || [],
          bundleLabel: product.node.title,
          bundlePrice: price,
          bundleUnitSize: 1,
        },
        country
      );

      trackAddToCart({
        contentName: product.node.title,
        contentId: chosen.id,
        value: price,
        currency,
        quantity: 1,
      });
      trackFunnelStep("add_to_cart", {
        step_value: product.node.title,
        value: price,
        currency,
        metadata: { bundle: key },
      });

      toast.success(`${product.node.title} ${t("product.addedToCart")}`, { position: "top-center" });
      setTimeout(() => setDrawerOpen(true), 500);
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <section className="mt-16 md:mt-24">
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const available = ORDER.filter((o) => products[o.key]);
  if (available.length === 0) return null;

  // Compact mode: mirror the Sleep&zy pack selector style (no images)
  if (compact) {
    return (
      <section className="mt-6 space-y-3" data-clarity-unmask="true">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {t("bundles.title")}
          </h3>
        </div>
        <div className="space-y-3">
          {available.map(({ key, pillowCount, tagLabel, tagColor }) => {
            const product = products[key]!;
            const variant = product.node.variants.edges[0]?.node;
            const price = variant ? parseFloat(variant.price.amount) : 0;
            const oldPrice = price * 2;
            const isFeatured = key === "family";
            const isAdding = adding === key;
            return (
              <button
                key={key}
                onClick={() => handleAdd(key, product)}
                disabled={isLoading || isAdding}
                className={`w-full rounded-xl p-4 border-2 transition-all text-left relative disabled:opacity-60 ${
                  isFeatured
                    ? "border-gold bg-gold/5 shadow-md"
                    : "border-border bg-card hover:border-gold/40"
                }`}
              >
                <span
                  className={`absolute -top-2.5 right-4 ${tagColor} text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}
                >
                  {tagLabel}
                </span>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {t(`bundles.${key}.name`)}
                      <span className="bg-gold/20 text-gold text-[10px] font-bold px-1.5 py-0.5 rounded">
                        -50%
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pillowCount} × {t("bundles.item.pillow")} · {t("bundles.item.mask")} · {t("bundles.item.earplugs")}
                    </p>
                    {isAdding && (
                      <p className="text-[11px] text-gold mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> {t("product.addedToCart")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 font-numeric-safe" data-clarity-unmask="true">
                    <p className="text-lg font-bold text-foreground">{formatPrice(price)}</p>
                    <p className="text-xs text-muted-foreground line-through">{formatPrice(oldPrice)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={compact ? "mt-6" : "mt-16 md:mt-24"} data-clarity-unmask="true">
      <div className={`text-center ${compact ? "mb-4" : "mb-8 md:mb-10"}`}>
        <div className="inline-flex items-center gap-2 bg-gold/10 text-gold text-xs font-bold px-3 py-1.5 rounded-full mb-2 uppercase tracking-wider">
          <Sparkles size={14} />
          {t("bundles.eyebrow")}
        </div>
        <h2 className={`font-serif font-bold text-foreground ${compact ? "text-xl md:text-2xl" : "text-3xl md:text-4xl"}`}>
          {t("bundles.title")}
        </h2>
        <p className={`text-muted-foreground mt-2 max-w-xl mx-auto ${compact ? "text-xs" : "text-sm md:text-base"}`}>
          {t("bundles.subtitle")}
        </p>
      </div>

      <div className={compact ? "flex flex-col gap-3" : "grid md:grid-cols-3 gap-5 md:gap-6"}>
        {available.map(({ key, pillowCount, tagLabel, tagColor }) => {
          const product = products[key]!;
          const variant = product.node.variants.edges[0]?.node;
          const price = variant ? parseFloat(variant.price.amount) : 0;
          const oldPrice = price * 2; // 50% off display
          const isFeatured = key === "family";

          // Pick a fallback image
          const img =
            key === "solo"
              ? FALLBACK_IMAGES[soloColor] || pillowGrey
              : pillowGrey;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`relative bg-card rounded-2xl border-2 overflow-hidden flex flex-col ${
                isFeatured ? "border-gold shadow-gold-glow" : "border-border"
              }`}
            >
              <span
                className={`absolute top-3 right-3 ${tagColor} text-primary-foreground text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider z-10`}
              >
                {tagLabel}
              </span>

              <div className="bg-gradient-to-br from-muted/50 to-background aspect-square flex items-center justify-center p-6">
                <img
                  src={img}
                  alt={product.node.title}
                  className="max-h-full max-w-full object-contain drop-shadow-xl"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif text-xl font-bold text-foreground leading-tight">
                  {t(`bundles.${key}.name`)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`bundles.${key}.tagline`)}
                </p>

                <ul className="mt-4 space-y-1.5 text-sm text-foreground/90 flex-1">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>
                      {pillowCount} × {t("bundles.item.pillow")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>
                      {pillowCount} × {t("bundles.item.mask")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>
                      {pillowCount} × {t("bundles.item.earplugs")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>
                      {pillowCount} × {t("bundles.item.pouch")}
                    </span>
                  </li>
                </ul>

                {/* Color selector for Solo */}
                {key === "solo" && (
                  <div className="flex items-center gap-2 mt-4">
                    {["GREY", "BLACK", "RED"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSoloColor(c)}
                        aria-label={c}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          soloColor === c ? "ring-2 ring-gold ring-offset-2 ring-offset-card scale-110 border-transparent" : "border-border"
                        }`}
                        style={{
                          backgroundColor:
                            c === "GREY" ? "#9CA3AF" : c === "BLACK" ? "#1F2937" : "#DC2626",
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-5 flex items-baseline gap-2 font-numeric-safe" data-clarity-unmask="true">
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(price)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(oldPrice)}
                  </span>
                  <span className="bg-gold text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                    -50%
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAdd(key, product)}
                  disabled={isLoading || adding === key}
                  className={`mt-4 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isFeatured
                      ? "bg-gold text-primary-foreground shadow-gold-glow"
                      : "bg-foreground text-background"
                  }`}
                >
                  {adding === key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>🛒 {t("products.shopNow")}</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default SleepBundles;
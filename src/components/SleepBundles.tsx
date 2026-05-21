import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
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

export type BundleKey = "solo" | "duo" | "family";

export interface SleepBundlesHandle {
  addSelected: () => Promise<void>;
}

export interface BundleSelectionSummary {
  key: BundleKey;
  label: string;
  price: number;
}

function classify(handle: string, title: string): BundleKey | null {
  const s = `${handle} ${title}`.toLowerCase();
  if (s.includes("solo")) return "solo";
  if (s.includes("family")) return "family";
  if (s.includes("duo")) return "duo";
  return null;
}

interface SleepBundlesProps {
  compact?: boolean;
  selectedBundle?: BundleKey | null;
  onSelectBundle?: (key: BundleKey | null) => void;
  hideCta?: boolean;
  onSelectionChange?: (summary: BundleSelectionSummary | null) => void;
  selectedColor?: string;
}

const SleepBundles = forwardRef<SleepBundlesHandle, SleepBundlesProps>(({
  compact = false,
  selectedBundle: controlledSelected,
  onSelectBundle,
  hideCta = false,
  onSelectionChange,
  selectedColor,
}, ref) => {
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
  // External color (from product page) overrides the internal solo color picker
  const effectiveColor = (selectedColor || soloColor || "GREY").toUpperCase();
  const [adding, setAdding] = useState<BundleKey | null>(null);
  const [internalSelected, setInternalSelected] = useState<BundleKey | null>(null);
  const isControlled = controlledSelected !== undefined;
  const selectedBundle = isControlled ? controlledSelected : internalSelected;
  const setSelectedBundle = (next: BundleKey | null) => {
    if (!isControlled) setInternalSelected(next);
    onSelectBundle?.(next);
  };

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
    // Match color for all bundle types (solo, duo, family)
    const colorMatch = variants.find((v) =>
      v.node.selectedOptions?.some(
        (o) => o.name === "Color" && o.value.toUpperCase() === effectiveColor
      )
    );
    if (colorMatch) chosen = colorMatch.node;

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

  // Expose imperative add for parent (controlled mode)
  useImperativeHandle(ref, () => ({
    addSelected: async () => {
      if (!selectedBundle) return;
      const product = products[selectedBundle];
      if (!product) return;
      await handleAdd(selectedBundle, product);
    },
  }), [selectedBundle, products, soloColor, selectedColor]);

  // Notify parent of selection summary changes
  useEffect(() => {
    if (!onSelectionChange) return;
    if (!selectedBundle) { onSelectionChange(null); return; }
    const product = products[selectedBundle];
    if (!product) { onSelectionChange(null); return; }
    const variant = product.node.variants.edges[0]?.node;
    const price = variant ? parseFloat(variant.price.amount) : 0;
    onSelectionChange({ key: selectedBundle, label: product.node.title, price });
  }, [selectedBundle, products, onSelectionChange]);

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
    const selectedProduct = selectedBundle ? products[selectedBundle] : null;
    return (
      <section className="mt-6 space-y-3" data-clarity-unmask="true">
        <div className="grid grid-cols-3 gap-2">
          {available.map(({ key, pillowCount }) => {
            const product = products[key]!;
            const variant = product.node.variants.edges[0]?.node;
            const price = variant ? parseFloat(variant.price.amount) : 0;
            const oldPrice = price * 2;
            const isSelected = selectedBundle === key;
            const isFeatured = key === "family";
            return (
              <button
                key={key}
                onClick={() => setSelectedBundle(selectedBundle === key ? null : key)}
                className={`relative flex flex-col items-center p-3 pt-6 rounded-xl border-2 transition-all text-center ${
                  isFeatured
                    ? `bg-dark-blue border-gold shadow-xl ${isSelected ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : ""}`
                    : `bg-card ${isSelected ? "border-gold ring-2 ring-gold/30" : "border-border hover:border-gold/50"}`
                }`}
              >
                {isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-primary-foreground text-[9px] font-black px-2 py-1 rounded shadow-sm whitespace-nowrap tracking-wider">
                    {t("bundles.tag.family") || "BEST VALUE"}
                  </span>
                )}
                {!isFeatured && (
                  <span className="absolute top-0 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-[10px] bg-gold/15 text-gold">
                    -50%
                  </span>
                )}
                <span className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${isFeatured ? "text-white" : "text-foreground"}`}>
                  {key === "solo" ? "SOLO" : key === "duo" ? "DUO" : "FAMILY"}
                </span>
                <div className="flex flex-col items-center mb-2 font-numeric-safe" data-clarity-unmask="true">
                  <span className={`text-[10px] line-through ${isFeatured ? "text-white/40" : "text-muted-foreground"}`}>
                    {formatPrice(oldPrice)}
                  </span>
                  <span className={`text-base font-bold ${isFeatured ? "text-gold" : "text-foreground"}`}>
                    {formatPrice(price)}
                  </span>
                </div>
                <p className={`text-[9px] leading-tight ${isFeatured ? "text-white/70" : "text-muted-foreground"}`}>
                  {pillowCount}× {t("bundles.item.pillow")} + {t("bundles.item.mask")} + {t("bundles.item.earplugs")}
                </p>
                {isSelected && (
                  <span className={`absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center ${isFeatured ? "bg-gold" : "bg-gold"}`}>
                    <Check size={10} className="text-primary-foreground" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {!hideCta && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => selectedBundle && selectedProduct && handleAdd(selectedBundle, selectedProduct)}
          disabled={isLoading || adding !== null || !selectedBundle || !selectedProduct}
          className="w-full bg-foreground text-background py-3 rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : !selectedBundle ? (
            <>{t("product.addToCart")}</>
          ) : (
            <>🛒 {t("product.addToCart")} — {t(`bundles.${selectedBundle}.name`)}</>
          )}
        </motion.button>
        )}
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
});

SleepBundles.displayName = "SleepBundles";

export default SleepBundles;
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";

const COLOR_MAP: Record<string, string> = {
  Grey: "#9CA3AF",
  Black: "#1F2937",
  Red: "#DC2626",
};
const COLORS = Object.keys(COLOR_MAP);

const useCountdown = (minutes: number) => {
  const [seconds, setSeconds] = useState(() => {
    const saved = sessionStorage.getItem("bundle-countdown");
    if (saved) {
      const remaining = Math.max(0, parseInt(saved) - Math.floor(Date.now() / 1000));
      return remaining > 0 ? remaining : minutes * 60;
    }
    const end = Math.floor(Date.now() / 1000) + minutes * 60;
    sessionStorage.setItem("bundle-countdown", String(end));
    return minutes * 60;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const BundleOffer = () => {
  const [selected, setSelected] = useState(2);
  const [selectedColor, setSelectedColor] = useState("Grey");
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const { t, lang } = useLanguage();
  const countdown = useCountdown(15);
  const addItem = useCartStore((s) => s.addItem);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const isLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    fetchProducts(20)
      .then((products) => {
        if (products.length > 0) setProduct(products[0]);
      })
      .catch(console.error);
  }, []);

  const currencySymbol = lang === "en" ? "$" : "€";

  const bundles = [
    { qty: 1, label: "1 Sleep&zy", price: `${currencySymbol}29.95 CAD`, oldPrice: `${currencySymbol}59.95 CAD`, perUnit: `${currencySymbol}29.95 CAD${t("bundle.perUnit")}`, tag: null, packValue: "Single", priceNum: 29.95 },
    { qty: 2, label: "2 Sleep&zy", price: `${currencySymbol}59.95 CAD`, oldPrice: `${currencySymbol}119.95 CAD`, perUnit: `${currencySymbol}29.98 CAD${t("bundle.perUnit")}`, tag: "DUO PACK", packValue: "Duo Pack", priceNum: 59.95 },
    { qty: 3, label: "3 Sleep&zy", price: `${currencySymbol}64.95 CAD`, oldPrice: `${currencySymbol}179.95 CAD`, perUnit: `${currencySymbol}21.65 CAD${t("bundle.perUnit")}`, tag: "FAMILY PACK", packValue: "Family Pack", priceNum: 64.95 },
  ];

  const titleParts = t("bundle.title").split(/<gold>|<\/gold>/);
  const socialParts = t("bundle.socialProof").split(/<bold>|<\/bold>/);

  const handleAddToCart = async () => {
    if (!product) return;
    const selectedBundle = bundles[selected];

    const variants = product.node.variants.edges;
    const matchingVariant = variants.find((v) => {
      const opts = v.node.selectedOptions || [];
      const hasColor = opts.some((o) => o.name === "Color" && o.value === selectedColor);
      const hasPack = opts.some((o) => o.value === selectedBundle.packValue);
      return hasColor && hasPack;
    })?.node;

    if (!matchingVariant) {
      console.error("No matching variant found", { color: selectedColor, pack: selectedBundle.packValue });
      return;
    }

    const bundleLabel = selectedBundle.tag || selectedBundle.label;

    await addItem({
      product,
      variantId: matchingVariant.id,
      variantTitle: matchingVariant.title,
      price: matchingVariant.price,
      quantity: 1,
      selectedOptions: matchingVariant.selectedOptions || [],
      bundleLabel,
      bundlePrice: selectedBundle.priceNum,
      bundleUnitSize: 1,
    });

    setTimeout(() => setDrawerOpen(true), 500);
  };

  return (
    <section id="offer" className="py-14 md:py-24 bg-card">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            {t("bundle.subtitle")}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
            {titleParts[0]}<span className="text-gold italic">{titleParts[1]}</span>{titleParts[2]}
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-10 italic font-semibold"
        >
          <span className="font-bold">{socialParts[1]}</span>{socialParts[2]}
        </motion.p>

        {/* Color selector */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-sm font-medium ${
                selectedColor === color
                  ? "border-gold bg-gold/10 text-foreground shadow-md scale-105"
                  : "border-border text-muted-foreground hover:border-gold/50 hover:scale-105"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ backgroundColor: COLOR_MAP[color] }}
              />
              {color}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          {bundles.map((b, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(i)}
              className={`w-full rounded-2xl p-5 border-2 transition-all text-left relative ${
                selected === i
                  ? "border-gold bg-gold/5 shadow-lg"
                  : "border-border bg-card hover:border-gold/40"
              }`}
            >
              {b.tag && (
                <span className="absolute -top-3 right-4 bg-gold text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {b.tag}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected === i ? "border-gold bg-gold" : "border-border"
                    }`}
                  >
                    <AnimatePresence>
                      {selected === i && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check size={14} className="text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{b.label}</p>
                    <p className="text-xs text-muted-foreground">{b.perUnit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{b.price}</p>
                  <p className="text-xs text-muted-foreground line-through">{b.oldPrice}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 space-y-3"
        >
          {/* Countdown timer */}
          <div className="flex items-center justify-center gap-2 bg-destructive/10 rounded-xl py-2.5 px-4">
            <Clock size={16} className="text-destructive" />
            <span className="text-sm font-bold text-destructive">
              {t("bundle.countdown")} {countdown}
            </span>
          </div>

          {/* Low stock */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse-dot" />
            <span className="text-sm font-semibold text-destructive">{t("bundle.lowStock")}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-destructive h-full rounded-full animate-progress-pulse" style={{ width: "12%" }} />
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleAddToCart}
          disabled={!product || isLoading}
          className="block w-full bg-gold text-primary-foreground text-center py-4 rounded-full text-lg font-bold shadow-gold-glow uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {t("bundle.cta")}
        </motion.button>

        <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <span>{t("bundle.securePayment")}</span>
          <span>{t("bundle.freeShipping")}</span>
          <span>{t("bundle.guarantee")}</span>
        </div>
      </div>
    </section>
  );
};

export default BundleOffer;

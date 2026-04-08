import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, Truck, RotateCcw, Clock, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import pillowGrey from "@/assets/product-pillow-grey-new.png";
import pillowBlack from "@/assets/product-pillow-black.webp";
import pillowRed from "@/assets/product-pillow-red.webp";

const COLOR_IMAGES: Record<string, string> = {
  Grey: pillowGrey,
  Black: pillowBlack,
  Red: pillowRed,
};
import inUse1 from "@/assets/product-inuse-1.jpg";
import inUse2 from "@/assets/product-inuse-2.jpg";
import inUse3 from "@/assets/product-inuse-3.jpg";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts, type ShopifyProduct, applyDiscountToCart } from "@/lib/shopify";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useLanguage } from "@/i18n/LanguageContext";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";

const COLOR_MAP: Record<string, string> = {
  Grey: "#9CA3AF",
  Black: "#1F2937",
  Red: "#DC2626",
};

function useCountdown(minutes: number) {
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
}

const Product = () => {
  const [searchParams] = useSearchParams();
  const bundleParam = parseInt(searchParams.get("bundle") || "1", 10);
  const promoCode = searchParams.get("promo") || null;
  const hasPromo = promoCode === "SLEEPZY10";
  const promoMultiplier = hasPromo ? 0.9 : 1;
  const initialQty = [1, 2, 3].includes(bundleParam) ? bundleParam : 1;
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQty, setSelectedQty] = useState(initialQty);
  const [selectedColor, setSelectedColor] = useState("Grey");
  const countdown = useCountdown(15);
  const { t, lang } = useLanguage();

  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  useEffect(() => {
    fetchProducts(1)
      .then((products) => {
        if (products.length > 0) {
          setProduct(products[0]);
          // Track ViewContent
          const p = products[0];
          const price = p.node.priceRange.minVariantPrice;
          trackViewContent({
            contentName: p.node.title,
            contentId: p.node.id,
            value: parseFloat(price.amount),
            currency: price.currencyCode,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const colorOption = product?.node.options?.find(o => o.name === "Color");
  const availableColors = colorOption?.values || ["Grey"];

  const variants = product?.node.variants.edges || [];
  const coloredVariants = variants.filter(v =>
    v.node.selectedOptions?.some(o => o.name === "Color" && o.value === selectedColor)
  );

  const singleVariant = coloredVariants.find(v => v.node.selectedOptions?.some(o => o.value === 'Single'))?.node || coloredVariants[0]?.node;
  const duoVariant = coloredVariants.find(v => v.node.selectedOptions?.some(o => o.value === 'Duo Pack'))?.node;
  const familyVariant = coloredVariants.find(v => v.node.selectedOptions?.some(o => o.value === 'Family Pack'))?.node;

  const singlePrice = singleVariant ? parseFloat(singleVariant.price.amount) : 29.95;
  const duoPrice = duoVariant ? parseFloat(duoVariant.price.amount) : 59.90;
  const familyPrice = familyVariant ? parseFloat(familyVariant.price.amount) : 64.90;
  const currencySymbol = lang === "en" ? "$" : "€";
  const oldPricePerUnit = singlePrice * 2;

  const badges = [
    t("product.badge360"),
    t("product.badgeFreeShipping"),
    t("product.badgeWinterSale"),
  ];

  const bundles = [
    { qty: 1, label: "1 Sleep&zy", desc: t("product.desc1"), discount: "-54%", tag: null, tagColor: "", variantNode: singleVariant },
    { qty: 2, label: "2 Sleep&zy", desc: t("product.desc2"), discount: "-54%", tag: "DUO PACK", tagColor: "bg-gold", variantNode: duoVariant },
    { qty: 3, label: "3 Sleep&zy", desc: t("product.desc3"), discount: "-67%", tag: "FAMILY PACK", tagColor: "bg-destructive", variantNode: familyVariant },
  ];

  const bundlePrices: Record<number, number> = { 1: singlePrice * promoMultiplier, 2: duoPrice * promoMultiplier, 3: familyPrice * promoMultiplier };
  const bundleOldPrices: Record<number, number> = { 1: oldPricePerUnit, 2: oldPricePerUnit * 2, 3: oldPricePerUnit * 3 };

  const handleAddToCart = async () => {
    if (!product) return;
    const selectedBundle = bundles.find(b => b.qty === selectedQty)!;
    const selectedVariant = selectedBundle.variantNode;
    if (!selectedVariant) return;
    const bundleLabel = selectedBundle.tag || selectedBundle.label;
    const bundleTotal = bundlePrices[selectedQty];

    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
      bundleLabel,
      bundlePrice: bundleTotal,
      bundleUnitSize: 1,
    });

    // Track AddToCart with Meta Pixel
    trackAddToCart({
      contentName: `${selectedBundle.label} (${selectedColor})`,
      contentId: selectedVariant.id,
      value: bundleTotal,
      currency: lang === 'en' ? 'USD' : 'EUR',
      quantity: selectedQty,
    });

    toast.success(`${selectedBundle.label} (${selectedColor}) ${t("product.addedToCart")}`, {
      position: "top-center",
    });

    if (hasPromo) {
      const cartId = useCartStore.getState().cartId;
      if (cartId) {
        await applyDiscountToCart(cartId, promoCode!);
      }
    }

    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedBundle = bundles.find(b => b.qty === selectedQty)!;
  const currentPrice = bundlePrices[selectedQty];
  const currentOldPrice = bundleOldPrices[selectedQty];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 md:py-12 pt-28 md:pt-32">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-sans-body">Home</span>
        </Link>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* LEFT — Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute top-3 left-3 z-10 bg-gold text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
              {t("product.winterSaleTag")}
            </div>
            <div className="bg-gradient-to-br from-muted/50 to-background rounded-2xl p-8 flex items-center justify-center min-h-[350px] md:min-h-[450px] border border-border">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedColor}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  src={COLOR_IMAGES[selectedColor] || pillowGrey}
                  alt={`Sleep&zy Cervical Pillow - ${selectedColor}`}
                  className="w-full max-w-sm drop-shadow-xl animate-float"
                />
              </AnimatePresence>
            </div>

            {/* In-use photos */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[inUse1, inUse2, inUse3].map((src, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border aspect-square">
                  <img
                    src={src}
                    alt={`Sleep&zy in use ${i + 1}`}
                    loading="lazy"
                    width={640}
                    height={640}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>


          {/* RIGHT — Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b} className="border border-border rounded-full px-3 py-1 text-xs text-muted-foreground font-sans-body">
                  ✅ {b}
                </span>
              ))}
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                {product?.node.title || "Sleep&zy™ — Cervical Pillow"}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="inline-flex items-center justify-center w-7 h-7 bg-success rounded-[3px]">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                        <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 6.9L12 17.3 5.7 20.7 7 13.8 2 9.2l7.1-.9L12 2z" />
                      </svg>
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-sans-body">{t("product.reviews")}</span>
              </div>
            </div>

            {/* Promo banner */}
            {hasPromo && (
              <div className="bg-gradient-to-r from-[hsl(var(--gold))] to-amber-500 text-primary-foreground text-center py-3 rounded-lg font-bold text-sm tracking-wide animate-pulse">
                {t("product.promoApplied")}
              </div>
            )}

            {/* Sale banner */}
            <div className="bg-gold text-primary-foreground text-center py-2.5 rounded-lg font-bold text-sm tracking-wide">
              {t("product.winterSaleBanner")}
            </div>

            {/* Stock + Countdown combined */}
            <div className="border border-border rounded-lg px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-dot" />
                  <span className="text-sm font-semibold text-destructive">{t("product.stockLeft")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gold" />
                  <span className="text-xs font-bold text-gold font-sans-body">{countdown}</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-destructive h-full rounded-full animate-progress-pulse" style={{ width: "25%" }} />
              </div>
            </div>

            {/* Color selector */}
            {availableColors.length > 1 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {t("product.color")}: <span className="text-muted-foreground font-normal">{selectedColor}</span>
                </p>
                <div className="flex items-center gap-3">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`relative w-9 h-9 rounded-full transition-all duration-200 ${
                        selectedColor === color
                          ? "ring-2 ring-gold ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105 ring-1 ring-border"
                      }`}
                      style={{ backgroundColor: COLOR_MAP[color] || "#9CA3AF" }}
                      aria-label={`Select ${color}`}
                    >
                      <AnimatePresence>
                        {selectedColor === color && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Check size={16} className="text-white drop-shadow-md" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bundle selection */}
            <div className="space-y-3">
              {bundles.map((b) => (
                <button
                  key={b.qty}
                  onClick={() => setSelectedQty(b.qty)}
                  className={`w-full rounded-xl p-4 border-2 transition-all text-left relative ${
                    selectedQty === b.qty
                      ? "border-gold bg-gold/5 shadow-md"
                      : "border-border bg-card hover:border-gold/40"
                  }`}
                >
                  {selectedQty === b.qty && (
                    <span className="absolute -top-2.5 left-4 bg-gold text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                      ✓ {t("product.selected")}
                    </span>
                  )}
                  {b.tag && (
                    <span className={`absolute -top-2.5 right-4 ${b.tagColor} text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded`}>
                      {b.tag}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedQty === b.qty ? "border-gold bg-gold" : "border-muted-foreground/30"
                      }`}>
                        <AnimatePresence>
                          {selectedQty === b.qty && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Check size={12} className="text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                          {b.label}
                          <span className="bg-gold/20 text-gold text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {b.discount}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{b.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{currencySymbol}{bundlePrices[b.qty].toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground line-through">{currencySymbol}{bundleOldPrices[b.qty].toFixed(2)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Price summary */}
            <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
              <span className="text-sm text-muted-foreground font-sans-body">{t("product.yourPrice")}</span>
              <span className="text-2xl font-bold text-foreground">{currencySymbol}{currentPrice.toFixed(2)}</span>
              {hasPromo && (
                <span className="text-sm text-muted-foreground line-through">
                  {currencySymbol}{(currentPrice / promoMultiplier).toFixed(2)}
                </span>
              )}
              <span className="text-sm text-muted-foreground line-through">{currencySymbol}{currentOldPrice.toFixed(2)}</span>
              <span className="bg-gold text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">{selectedBundle.discount}</span>
              {hasPromo && (
                <span className="bg-destructive text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-10% EXTRA</span>
              )}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={isLoading || !product}
              className="w-full bg-gold text-primary-foreground py-4 rounded-xl text-base font-bold shadow-gold-glow flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>🛒 {t("product.addToCart")} — {selectedBundle.label}</>
              )}
            </motion.button>

            {/* Trust */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-sans-body">
                <span className="flex items-center gap-1"><ShieldCheck size={14} /> {t("product.securePayment")}</span>
                <span className="flex items-center gap-1"><Truck size={14} /> {t("product.freeShipping")}</span>
                <span className="flex items-center gap-1"><RotateCcw size={14} /> {t("product.guarantee90")}</span>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#1A1F71"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">VISA</text></svg>
                <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#252525"/><circle cx="19" cy="16" r="9" fill="#EB001B"/><circle cx="29" cy="16" r="9" fill="#F79E1B"/><path d="M24 9.5a9 9 0 0 1 0 13" fill="#FF5F00"/></svg>
                <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#2E77BC"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">AMEX</text></svg>
                <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#fff" stroke="#ddd"/><text x="24" y="14" textAnchor="middle" fill="#4285F4" fontSize="7" fontWeight="bold" fontFamily="sans-serif">G</text><text x="24" y="23" textAnchor="middle" fill="#5F6368" fontSize="7" fontFamily="sans-serif">Pay</text></svg>
                <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#003087"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">PayPal</text></svg>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck size={12} className="text-success" />
                {t("product.sslEncryption")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Product;

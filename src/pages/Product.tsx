import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShieldCheck, Truck, RotateCcw, Clock, Loader2, ArrowLeft } from "lucide-react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import pillowGrey from "@/assets/product-pillow-grey-new.webp";
import pillowBlack from "@/assets/product-pillow-black.webp";
import pillowRed from "@/assets/product-pillow-red.webp";

const COLOR_IMAGES: Record<string, string> = {
  Grey: pillowGrey,
  Black: pillowBlack,
  Red: pillowRed,
};
import { ChevronLeft, ChevronRight } from "lucide-react";
import inUse1 from "@/assets/product-inuse-1.webp";
import inUse2 from "@/assets/product-inuse-2.webp";
import inUse3 from "@/assets/product-inuse-3.jpg";
import inUseCar from "@/assets/lifestyle-car.webp";
import inUsePlane from "@/assets/lifestyle-plane.webp";
import inUsePlane2 from "@/assets/lifestyle-plane2.webp";
import inUseCar2 from "@/assets/lifestyle-car2.webp";
import inUsePlane3 from "@/assets/lifestyle-plane3.webp";
import inUsePlane4 from "@/assets/lifestyle-plane4.webp";
import sleepKitPremium from "@/assets/sleep-kit-three-essentials.png";
import bundleThreeItemsHero from "@/assets/bundle-three-items-hero.jpg";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts, type ShopifyProduct, applyDiscountToCart } from "@/lib/shopify";
import { toast } from "sonner";
import Header from "@/components/Header";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";
import { trackFunnelStep, trackFriction } from "@/lib/funnelTracking";
import { lazy, Suspense } from "react";
const ProductBenefits = lazy(() => import("@/components/ProductBenefits"));
import SleepBundles, { type SleepBundlesHandle, type BundleSelectionSummary } from "@/components/SleepBundles";

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
  const bundleParamRaw = searchParams.get("bundle");
  const bundleParam = bundleParamRaw ? parseInt(bundleParamRaw, 10) : null;
  const colorParam = searchParams.get("color");
  const initialColor = colorParam && ["Grey", "Black", "Red"].includes(colorParam) ? colorParam : "Grey";
  const promoCode = searchParams.get("promo") || null;
  const hasPromo = promoCode === "SLEEPZY10";
  const promoMultiplier = hasPromo ? 0.9 : 1;
  const initialQty = bundleParam && [1, 2, 3].includes(bundleParam) ? bundleParam : 3;
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQty, setSelectedQty] = useState<number | null>(initialQty);
  const [selectedBundleKey, setSelectedBundleKey] = useState<BundleSelectionSummary["key"] | null>(null);
  const [bundleSummary, setBundleSummary] = useState<BundleSelectionSummary | null>(null);
  const bundlesRef = useRef<SleepBundlesHandle>(null);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [userPickedColor, setUserPickedColor] = useState(false);
  const [galleryOffset, setGalleryOffset] = useState(0);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const countdown = useCountdown(15);
  const { t } = useLanguage();
  const { country, currency, prices, formatPrice } = useMarket();

  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  useEffect(() => {
    fetchProducts(1, undefined, country)
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
          trackFunnelStep('view_product', {
            step_value: p.node.handle,
            value: parseFloat(price.amount),
            currency: price.currencyCode,
          });
        } else {
          trackFriction('product_load_error', {
            severity: 'error',
            message: 'No products returned from Shopify',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        trackFriction('product_load_error', {
          severity: 'error',
          message: err instanceof Error ? err.message : 'fetchProducts failed',
        });
      })
      .finally(() => setLoading(false));
  }, [country]);

  const colorOption = product?.node.options?.find(o => o.name === "Color");
  const availableColors = colorOption?.values || ["Grey"];

  const variants = product?.node.variants.edges || [];
  const coloredVariants = variants.filter(v =>
    v.node.selectedOptions?.some(o => o.name === "Color" && o.value === selectedColor)
  );

  const singleVariant = coloredVariants.find(v => v.node.selectedOptions?.some(o => o.value === 'Single'))?.node || coloredVariants[0]?.node;
  const duoVariant = coloredVariants.find(v => v.node.selectedOptions?.some(o => o.value === 'Duo Pack'))?.node;
  const familyVariant = coloredVariants.find(v => v.node.selectedOptions?.some(o => o.value === 'Family Pack'))?.node;

  // Pricing comes from MarketContext (CA/US/FR)
  const singlePrice = prices.single;
  const duoPrice = prices.duo;
  const familyPrice = prices.family;

  const badges = [
    t("product.badge360"),
    t("product.badgeFreeShipping"),
    t("product.badgeWinterSale"),
  ];

  const bundles = [
    { qty: 1, label: "1 Sleep&zy", desc: t("product.desc1"), discount: "-50%", tag: "SOLO TRAVELERS", tagLabel: t("product.tag.solo"), tagColor: "bg-dark-blue", variantNode: singleVariant },
    { qty: 2, label: "2 Sleep&zy", desc: t("product.desc2"), discount: "-50%", tag: "DUO PACK", tagLabel: t("product.tag.duo"), tagColor: "bg-gold", variantNode: duoVariant },
    { qty: 3, label: "3 Sleep&zy", desc: t("product.desc3"), discount: "-64%", tag: "FAMILY PACK", tagLabel: t("product.tag.family"), tagColor: "bg-destructive", variantNode: familyVariant },
  ];

  const bundlePrices: Record<number, number> = { 1: singlePrice * promoMultiplier, 2: duoPrice * promoMultiplier, 3: familyPrice * promoMultiplier };
  const bundleOldPrices: Record<number, number> = { 1: prices.oldSingle, 2: prices.oldDuo, 3: prices.oldFamily };

  const handleAddToCart = async () => {
    if (!product || !selectedQty) return;
    const selectedBundle = bundles.find(b => b.qty === selectedQty)!;
    const selectedVariant = selectedBundle.variantNode;
    if (!selectedVariant) {
      trackFriction('checkout_error', {
        severity: 'error',
        message: 'No variant matched selected bundle/color',
        metadata: { bundle: selectedBundle.label, color: selectedColor },
      });
      return;
    }
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
    }, country);

    // Track AddToCart with Meta Pixel
    trackAddToCart({
      contentName: `${selectedBundle.label} (${selectedColor})`,
      contentId: selectedVariant.id,
      value: bundleTotal,
      currency,
      quantity: selectedQty,
    });
    trackFunnelStep('add_to_cart', {
      step_value: bundleLabel,
      value: bundleTotal,
      currency,
      metadata: { color: selectedColor, qty: selectedQty },
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

  const handleSelectPack = (qty: number) => {
    setSelectedQty(qty);
    setSelectedBundleKey(null);
    trackFunnelStep('select_bundle', {
      step_value: bundles.find(b => b.qty === qty)?.tag || `pack-${qty}`,
      value: bundlePrices[qty],
      currency,
    });
  };

  const handleSelectBundle = useCallback((key: BundleSelectionSummary["key"] | null) => {
    setSelectedBundleKey(key);
    if (key) setSelectedQty(null);
  }, []);

  const handleBundleSummary = useCallback((s: BundleSelectionSummary | null) => {
    setBundleSummary(s);
  }, []);

  const hasSelection = selectedQty !== null || (selectedBundleKey !== null && bundleSummary !== null);

  const handleUnifiedAdd = async () => {
    if (selectedQty) {
      await handleAddToCart();
    } else if (selectedBundleKey) {
      await bundlesRef.current?.addSelected();
    }
  };

  const ctaLabel = selectedQty
    ? `🛒 ${t("product.addToCart")} — ${bundles.find(b => b.qty === selectedQty)?.label}`
    : selectedBundleKey && bundleSummary
      ? `🛒 ${t("product.addToCart")} — ${bundleSummary.label}`
      : t("product.addToCart");

  const ctaPrice = selectedQty
    ? bundlePrices[selectedQty]
    : bundleSummary?.price ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedBundle = selectedQty ? bundles.find(b => b.qty === selectedQty)! : null;
  const currentPrice = selectedQty ? bundlePrices[selectedQty] : null;
  const currentOldPrice = selectedQty ? bundleOldPrices[selectedQty] : null;

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
                  onClick={() => setLightboxSrc(COLOR_IMAGES[selectedColor] || pillowGrey)}
                  className="w-full max-w-sm drop-shadow-xl animate-float cursor-zoom-in"
                />
              </AnimatePresence>
            </div>

            {/* In-use photos carousel */}
            {(() => {
              const allPhotos = [inUse1, inUsePlane4, inUse2, inUse3, inUseCar, inUsePlane, inUsePlane2, inUseCar2, inUsePlane3];
              const visibleCount = 5;
              const maxOffset = allPhotos.length - visibleCount;
              return (
                <div className="relative mt-4 group">
                  <p className="text-center text-xs sm:text-sm uppercase tracking-[0.2em] text-muted-foreground font-sans-body mb-3">
                    Nos clients parlent pour nous
                  </p>
                  <div className="overflow-hidden rounded-xl">
                    <div
                      className="flex gap-2 transition-transform duration-300 ease-in-out"
                      style={{ transform: `translateX(-${(galleryOffset / visibleCount) * 100}%)` }}
                    >
                      {allPhotos.map((src, i) => (
                        <div key={i} className="shrink-0 rounded-xl overflow-hidden border border-border aspect-square" style={{ width: `calc((100% - ${(visibleCount - 1) * 8}px) / ${visibleCount})` }}>
                          <img
                            src={src}
                            alt={`Sleep&zy in use ${i + 1}`}
                            loading="lazy"
                            width={640}
                            height={640}
                            onClick={() => setLightboxSrc(src)}
                            className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {galleryOffset > 0 && (
                    <button
                      onClick={() => setGalleryOffset(Math.max(0, galleryOffset - 1))}
                      className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:bg-background transition-colors z-10"
                      aria-label="Previous photos"
                    >
                      <ChevronLeft size={16} className="text-foreground" />
                    </button>
                  )}
                  {galleryOffset < maxOffset && (
                    <button
                      onClick={() => setGalleryOffset(Math.min(maxOffset, galleryOffset + 1))}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:bg-background transition-colors z-10"
                      aria-label="Next photos"
                    >
                      <ChevronRight size={16} className="text-foreground" />
                    </button>
                  )}
                </div>
              );
            })()}

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
                      onClick={() => {
                        setSelectedColor(color);
                        trackFunnelStep('select_color', { step_value: color });
                      }}
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

            {/* Quantity stepper — option D test */}
            {(() => {
              const stepperDimmed = selectedBundleKey !== null;
              const activeQty = selectedQty ?? 0;
              const activeBundle = activeQty ? bundles.find(b => b.qty === activeQty) : null;
              const activeTotal = activeQty ? bundlePrices[activeQty] : 0;
              const activeOld = activeQty ? bundleOldPrices[activeQty] : 0;
              const activeSavings = activeOld - activeTotal;
              return (
                <div className={`rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/5 to-card p-4 md:p-5 space-y-4 transition-opacity ${stepperDimmed ? "opacity-50" : "opacity-100"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{t("product.quantity")}</p>
                    {activeBundle?.tag && !stepperDimmed && (
                      <span className={`${activeBundle.tagColor} text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded`}>
                        {activeBundle.tagLabel}
                      </span>
                    )}
                  </div>

                  {/* Segmented quantity buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {bundles.map((b) => {
                      const isActive = !stepperDimmed && selectedQty === b.qty;
                      const unitPrice = bundlePrices[b.qty] / b.qty;
                      return (
                        <button
                          key={b.qty}
                          onClick={() => handleSelectPack(b.qty)}
                          className={`relative rounded-xl py-3 px-2 border-2 transition-all text-center ${
                            isActive
                              ? "border-gold bg-gold text-primary-foreground shadow-md scale-[1.02]"
                              : "border-border bg-card text-foreground hover:border-gold/50"
                          }`}
                        >
                          {b.qty > 1 && (
                            <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                              isActive ? "bg-destructive text-primary-foreground" : "bg-gold/20 text-gold"
                            }`}>
                              {b.discount}
                            </span>
                          )}
                          <div className="text-2xl font-bold leading-none">{b.qty}</div>
                          <div className={`text-[10px] mt-1 font-medium ${isActive ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                            {formatPrice(unitPrice)}<span className="opacity-70"> {t("product.perPillow")}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Total + savings */}
                  {activeQty > 0 && !stepperDimmed && (
                    <div className="flex items-end justify-between pt-2 border-t border-border/60">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("product.total")}</p>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-2xl font-bold text-foreground">{formatPrice(activeTotal)}</span>
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(activeOld)}</span>
                        </div>
                      </div>
                      {activeSavings > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{t("product.youSave")}</p>
                          <p className="text-lg font-bold text-destructive">{formatPrice(activeSavings)} 🔥</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Elegant intro to the all-in-one bundles */}
            <div className="relative text-center px-2 pt-4 pb-1">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-gold/60" />
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-gold">
                  {t("product.bundles.introEyebrow")}
                </span>
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-gold/60" />
              </div>
              <h3 className="font-serif text-xl md:text-2xl leading-snug text-foreground italic">
                {t("product.bundles.introTitle")}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                {t("product.bundles.introSubtitle")}
              </p>
            </div>

            {/* Bundle visual — compact hero showing the 3 items, anchors the offer right before the cards */}
            <div className="relative rounded-2xl overflow-hidden border border-gold/20 bg-cream/30 aspect-[5/3]">
              <img
                src={bundleThreeItemsHero}
                alt="Sleep Kit bundle — ergonomic neck pillow, contoured sleep mask, noise-isolating earplugs"
                loading="lazy"
                width={1280}
                height={768}
                onClick={() => setLightboxSrc(bundleThreeItemsHero)}
                className="absolute inset-0 w-full h-full object-cover object-center cursor-zoom-in"
              />
              <div className="absolute top-3 left-3 bg-gold text-primary-foreground text-[10px] font-bold tracking-[0.18em] uppercase px-2.5 py-1 rounded shadow-sm">
                The Kit
              </div>
            </div>

            {/* Sleep Bundles — shown right under the first offers */}
            <SleepBundles
              ref={bundlesRef}
              compact
              hideCta
              selectedBundle={selectedBundleKey}
              onSelectBundle={handleSelectBundle}
              onSelectionChange={handleBundleSummary}
            />

            {/* Price summary — only for Sleep Kit bundles (quantity stepper already shows total) */}
            {hasSelection && ctaPrice !== null && selectedBundleKey && (
              <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
                <span className="text-sm text-muted-foreground font-sans-body">{t("product.yourPrice")}</span>
                <span className="text-2xl font-bold text-foreground">{formatPrice(ctaPrice)}</span>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(ctaPrice * 2)}</span>
                <span className="bg-gold text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-50%</span>
                {hasPromo && (
                  <span className="bg-destructive text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-10% EXTRA</span>
                )}
              </div>
            )}

            {/* Unified CTA (desktop inline) */}
            <motion.button
              whileHover={{ scale: hasSelection ? 1.02 : 1 }}
              whileTap={{ scale: hasSelection ? 0.97 : 1 }}
              onClick={handleUnifiedAdd}
              disabled={isLoading || !product || !hasSelection}
              className="w-full bg-gold text-primary-foreground py-4 rounded-xl text-base font-bold shadow-gold-glow flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : !hasSelection ? (
                <>{t("product.chooseFormat")}</>
              ) : (
                <>{ctaLabel}</>
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
              <p className="text-[11px] text-muted-foreground text-center leading-snug">
                {t("product.shopifyRedirect")}
              </p>
            </div>
          </motion.div>
        </div>

        <Suspense fallback={null}>
          <ProductBenefits />
        </Suspense>
      </div>

      {/* Sticky mobile CTA — single global CTA driven by current selection */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-md border-t border-border px-4 pt-2 pb-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <motion.button
          whileTap={{ scale: hasSelection ? 0.97 : 1 }}
          onClick={handleUnifiedAdd}
          disabled={isLoading || !product || !hasSelection}
          className="w-full bg-gold text-primary-foreground py-3 rounded-full text-sm font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : !hasSelection ? (
            <>{t("product.chooseFormat")}</>
          ) : (
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{ctaLabel}</span>
              {ctaPrice !== null && <span className="font-numeric-safe">· {formatPrice(ctaPrice)}</span>}
            </span>
          )}
        </motion.button>
      </div>
      <div className="md:hidden h-20" aria-hidden="true" />

      {/* Image lightbox */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxSrc(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setLightboxSrc(null)}
              aria-label="Close"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={22} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              src={lightboxSrc}
              alt="Zoomed product"
              onClick={(e) => e.stopPropagation()}
              className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Product;

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, ShieldCheck, Truck, RotateCcw, Star, Clock, Loader2 } from "lucide-react";
import pillowHero from "@/assets/product-pillow-grey.png";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";
import Header from "@/components/Header";

const badges = ["360° Support", "Free Shipping", "Winter Sale"];

function useCountdown() {
  const [seconds, setSeconds] = useState(53934);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const Product = () => {
  const [searchParams] = useSearchParams();
  const bundleParam = parseInt(searchParams.get("bundle") || "1", 10);
  const initialQty = [1, 2, 3].includes(bundleParam) ? bundleParam : 1;
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQty, setSelectedQty] = useState(initialQty);
  const countdown = useCountdown();
  const viewers = 28;

  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);

  useEffect(() => {
    fetchProducts(1)
      .then((products) => {
        if (products.length > 0) setProduct(products[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const variants = product?.node.variants.edges || [];
  const singleVariant = variants.find(v => v.node.selectedOptions?.some(o => o.value === 'Single'))?.node || variants[0]?.node;
  const duoVariant = variants.find(v => v.node.selectedOptions?.some(o => o.value === 'Duo Pack'))?.node;
  const familyVariant = variants.find(v => v.node.selectedOptions?.some(o => o.value === 'Family Pack'))?.node;

  const singlePrice = singleVariant ? parseFloat(singleVariant.price.amount) : 34.95;
  const duoPrice = duoVariant ? parseFloat(duoVariant.price.amount) : 54.87;
  const familyPrice = familyVariant ? parseFloat(familyVariant.price.amount) : 69.90;
  const currencySymbol = singleVariant?.price.currencyCode === "EUR" ? "€" : "$";
  const oldPricePerUnit = singlePrice * 2;

  const bundles = [
    { qty: 1, label: "1 Sleep&zy", desc: "1× Sleep&zy Anti-Embarrassment Pillow", discount: "-50%", tag: null, tagColor: "", variantNode: singleVariant },
    { qty: 2, label: "2 Sleep&zy", desc: "2× Sleep&zy Anti-Embarrassment Pillow", discount: "-61%", tag: "DUO PACK", tagColor: "bg-gold", variantNode: duoVariant },
    { qty: 3, label: "3 Sleep&zy", desc: "3× Sleep&zy Anti-Embarrassment Pillow", discount: "-67%", tag: "FAMILY PACK", tagColor: "bg-destructive", variantNode: familyVariant },
  ];

  const bundlePrices: Record<number, number> = { 1: singlePrice, 2: duoPrice, 3: familyPrice };
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

    toast.success(`${selectedBundle.label} added to cart`, {
      position: "top-center",
    });

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
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* LEFT — Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute top-3 left-3 z-10 bg-gold text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
              ❄️ WINTER SALE
            </div>
            <div className="bg-gradient-to-br from-muted/50 to-background rounded-2xl p-8 flex items-center justify-center min-h-[350px] md:min-h-[450px] border border-border">
              <img
                src={product?.node.images?.edges?.[0]?.node?.url || pillowHero}
                alt={product?.node.title || "Sleep&zy Cervical Pillow"}
                className="w-full max-w-sm drop-shadow-xl animate-float"
              />
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
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="fill-gold text-gold" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground font-sans-body">(12,000+ reviews)</span>
              </div>
            </div>

            {/* Promo banner */}
            <div className="bg-gold text-primary-foreground text-center py-2.5 rounded-lg font-bold text-sm tracking-wide">
              ❄️ WINTER SALE — UP TO 67% OFF!
            </div>

            {/* Viewers */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2 text-sm text-muted-foreground font-sans-body">
              <Eye size={15} />
              <span><strong className="text-foreground">{viewers} people</strong> are viewing this product right now</span>
            </div>

            {/* Stock */}
            <div className="border border-border rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse-dot" />
                <span className="text-sm font-semibold text-destructive">Only 8 left in stock</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-destructive h-full rounded-full animate-progress-pulse" style={{ width: "25%" }} />
              </div>
            </div>

            {/* Countdown */}
            <div className="bg-gold/10 border border-gold/30 text-center py-3 rounded-lg flex items-center justify-center gap-2">
              <Clock size={16} className="text-gold" />
              <span className="text-sm font-bold text-foreground font-sans-body">
                Offer expires in <span className="text-gold">{countdown}</span>
              </span>
            </div>

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
                      ✓ SELECTED
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
              <span className="text-sm text-muted-foreground font-sans-body">Your price:</span>
              <span className="text-2xl font-bold text-foreground">{currencySymbol}{currentPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">{currencySymbol}{currentOldPrice.toFixed(2)}</span>
              <span className="bg-gold text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">{selectedBundle.discount}</span>
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
                <>🛒 Add to cart — {selectedBundle.label}</>
              )}
            </motion.button>

            {/* Trust */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-sans-body">
                <span className="flex items-center gap-1"><ShieldCheck size={14} /> Secure payment</span>
                <span className="flex items-center gap-1"><Truck size={14} /> Free shipping</span>
                <span className="flex items-center gap-1"><RotateCcw size={14} /> 90-day guarantee</span>
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
                Secure checkout with SSL encryption
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Product;

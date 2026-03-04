import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Eye, ShieldCheck, Truck, RotateCcw, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import pillowHero from "@/assets/pillow-hero.png";
import CartDrawer, { type CartItem } from "@/components/CartDrawer";

const bundles = [
  {
    id: 0,
    label: "1 Sleep&zy",
    desc: "1× Sleep&zy Cervical Pillow",
    price: 34.95,
    oldPrice: 69.90,
    discount: "-50%",
    tag: null,
    tagColor: "",
  },
  {
    id: 1,
    label: "2 Sleep&zy",
    desc: "2× Sleep&zy Cervical Pillow",
    price: 54.90,
    oldPrice: 139.80,
    discount: "-61%",
    tag: "COUPLE PACK",
    tagColor: "bg-gold",
  },
  {
    id: 2,
    label: "3 Sleep&zy",
    desc: "3× Sleep&zy Cervical Pillow",
    price: 69.90,
    oldPrice: 209.70,
    discount: "-67%",
    tag: "FAMILY PACK",
    tagColor: "bg-destructive",
  },
];

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
  const [selected, setSelected] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const countdown = useCountdown();
  const bundle = bundles[selected];
  const viewers = 28;

  const handleAddToCart = () => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === bundle.id);
      if (existing) {
        return prev.map((i) => i.id === bundle.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id: bundle.id,
        label: bundle.label,
        qty: 1,
        unitPrice: bundle.price,
        unitOldPrice: bundle.oldPrice,
      }];
    });
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans-body">
            <ArrowLeft size={16} />
            Back to products
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
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
                src={pillowHero}
                alt="Sleep&zy Cervical Pillow"
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
                Sleep&zy™ — Cervical Pillow
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
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className={`w-full rounded-xl p-4 border-2 transition-all text-left relative ${
                    selected === b.id
                      ? "border-gold bg-gold/5 shadow-md"
                      : "border-border bg-card hover:border-gold/40"
                  }`}
                >
                  {selected === b.id && (
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
                        selected === b.id ? "border-gold bg-gold" : "border-muted-foreground/30"
                      }`}>
                        <AnimatePresence>
                          {selected === b.id && (
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
                      <p className="text-lg font-bold text-foreground">${b.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground line-through">${b.oldPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Price summary */}
            <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
              <span className="text-sm text-muted-foreground font-sans-body">Your price:</span>
              <span className="text-2xl font-bold text-foreground">${bundle.price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">${bundle.oldPrice.toFixed(2)}</span>
              <span className="bg-gold text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">{bundle.discount}</span>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              className="w-full bg-gold text-primary-foreground py-4 rounded-xl text-base font-bold shadow-gold-glow flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              🛒 Add to cart — {bundle.label}
            </motion.button>

            {/* Trust */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-sans-body">
                <span className="flex items-center gap-1"><ShieldCheck size={14} /> Secure payment</span>
                <span className="flex items-center gap-1"><Truck size={14} /> Free shipping</span>
                <span className="flex items-center gap-1"><RotateCcw size={14} /> 90-day guarantee</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="text-xs font-bold">VISA</span>
                <span className="text-xs font-bold">MC</span>
                <span className="text-xs font-bold">AMEX</span>
                <span className="text-xs font-bold">GPay</span>
                <span className="text-xs font-bold">PayPal</span>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck size={12} className="text-green-600" />
                Secure checkout with SSL encryption
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={(id, qty) => {
          setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
        }}
        onRemove={(id) => {
          setCartItems((prev) => prev.filter((i) => i.id !== id));
        }}
      />
    </div>
  );
};

export default Product;

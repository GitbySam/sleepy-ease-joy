import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Truck, RotateCcw, Minus, Plus, Trash2 } from "lucide-react";
import pillowHero from "@/assets/pillow-hero.png";

interface CartItem {
  label: string;
  qty: number;
  price: number;
  oldPrice: number;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  item: CartItem;
  onUpdateQty: (qty: number) => void;
}

const CartDrawer = ({ open, onClose, item, onUpdateQty }: CartDrawerProps) => {
  const savings = item.oldPrice - item.price;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground font-serif">🛒 Votre Panier</h2>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Cart content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Item card */}
              <div className="flex gap-4 bg-muted/30 rounded-xl p-4 border border-border">
                <div className="w-20 h-20 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src={pillowHero} alt="Sleepenzy" className="w-16 h-16 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">Sleepenzy™ — {item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Coussin Cervical Ergonomique</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-base font-bold text-foreground">{item.price.toFixed(2).replace(".", ",")}€</span>
                    <span className="text-xs text-muted-foreground line-through">{item.oldPrice.toFixed(2).replace(".", ",")}€</span>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => onUpdateQty(0)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center gap-2 border border-border rounded-lg">
                    <button
                      onClick={() => onUpdateQty(Math.max(1, item.qty - 1))}
                      className="p-1.5 hover:bg-muted transition-colors rounded-l-lg"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                    <button
                      onClick={() => onUpdateQty(item.qty + 1)}
                      className="p-1.5 hover:bg-muted transition-colors rounded-r-lg"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-5 space-y-4">
              {/* Savings banner */}
              <div className="bg-gold/10 border border-gold/30 text-center py-2 rounded-lg">
                <span className="text-sm font-bold text-foreground">
                  ❄️ Économie Hiver : <span className="text-gold">{savings.toFixed(2).replace(".", ",")}€</span> !
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{item.price.toFixed(2).replace(".", ",")}€</span>
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gold text-primary-foreground py-4 rounded-xl text-base font-bold shadow-gold-glow flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                🔒 Paiement Sécurisé
              </motion.button>

              {/* Payment icons */}
              <div className="flex items-center justify-center gap-3 opacity-60">
                <span className="text-xs font-bold">VISA</span>
                <span className="text-xs font-bold">MC</span>
                <span className="text-xs font-bold">AMEX</span>
                <span className="text-xs font-bold">GPay</span>
                <span className="text-xs font-bold">PayPal</span>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
                <span className="flex flex-col items-center gap-1">
                  <ShieldCheck size={16} />
                  Sécurisé
                </span>
                <span className="flex flex-col items-center gap-1">
                  <Truck size={16} />
                  Livraison gratuite
                </span>
                <span className="flex flex-col items-center gap-1">
                  <RotateCcw size={16} />
                  90 jours retour
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, Truck, RotateCcw, Minus, Plus, Trash2 } from "lucide-react";
import pillowHero from "@/assets/pillow-hero.png";

export interface CartItem {
  id: number;
  label: string;
  qty: number;
  unitPrice: number;
  unitOldPrice: number;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}

const CartDrawer = ({ open, onClose, items, onUpdateQty, onRemove }: CartDrawerProps) => {
  const totalPrice = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const totalOldPrice = items.reduce((sum, i) => sum + i.unitOldPrice * i.qty, 0);
  const savings = totalOldPrice - totalPrice;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground font-serif">🛒 Votre Panier</h2>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="w-20 h-20 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                    <img src={pillowHero} alt="Sleepenzy" className="w-16 h-16 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">Sleepenzy™ — {item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Coussin Cervical Ergonomique</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base font-bold text-foreground">{(item.unitPrice * item.qty).toFixed(2).replace(".", ",")}€</span>
                      <span className="text-xs text-muted-foreground line-through">{(item.unitOldPrice * item.qty).toFixed(2).replace(".", ",")}€</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2 border border-border rounded-lg">
                      <button
                        onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))}
                        className="p-1.5 hover:bg-muted transition-colors rounded-l-lg"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        className="p-1.5 hover:bg-muted transition-colors rounded-r-lg"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">Votre panier est vide</p>
              )}
            </div>

            <div className="border-t border-border px-5 py-5 space-y-4">
              {savings > 0 && (
                <div className="bg-gold/10 border border-gold/30 text-center py-2 rounded-lg">
                  <span className="text-sm font-bold text-foreground">
                    ❄️ Économie Hiver : <span className="text-gold">{savings.toFixed(2).replace(".", ",")}€</span> !
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">Total</span>
                <span className="text-xl font-bold text-foreground">{totalPrice.toFixed(2).replace(".", ",")}€</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gold text-primary-foreground py-4 rounded-xl text-base font-bold shadow-gold-glow flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                🔒 Paiement Sécurisé
              </motion.button>

              <div className="flex items-center justify-center gap-3 opacity-60">
                <span className="text-xs font-bold">VISA</span>
                <span className="text-xs font-bold">MC</span>
                <span className="text-xs font-bold">AMEX</span>
                <span className="text-xs font-bold">GPay</span>
                <span className="text-xs font-bold">PayPal</span>
              </div>

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

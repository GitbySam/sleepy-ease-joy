import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const bundles = [
  { qty: 1, label: "1 Sleepenzy", price: "34,95€", oldPrice: "69,90€", perUnit: "34,95€/unité", tag: null },
  { qty: 2, label: "2 Sleepenzy", price: "54,90€", oldPrice: "139,80€", perUnit: "27,45€/unité", tag: "BEST SELLER" },
  { qty: 3, label: "3 Sleepenzy", price: "69,90€", oldPrice: "209,70€", perUnit: "23,30€/unité", tag: "MEILLEURE OFFRE" },
];

const BundleOffer = () => {
  const [selected, setSelected] = useState(1);

  return (
    <section id="offer" className="py-24 bg-card">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Offre limitée — jusqu'à -67%
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
            Choisissez votre <span className="text-gold italic">offre</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-10 italic font-semibold"
        >
          <span className="font-bold">7 clients sur 10</span> offrent un Sleepenzy à un proche
        </motion.p>

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

        {/* Stock counter */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse-dot" />
            <span className="text-sm font-semibold text-destructive">Stock Faible — Plus que 3 en stock</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-destructive h-full rounded-full animate-progress-pulse" style={{ width: "12%" }} />
          </div>
        </motion.div>

        <Link to="/product">
          <motion.span
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="block w-full bg-gold text-primary-foreground text-center py-4 rounded-full text-lg font-bold shadow-gold-glow uppercase tracking-wider"
          >
            Commander maintenant
          </motion.span>
        </Link>

        <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <span>🔒 Paiement sécurisé</span>
          <span>🚚 Livraison gratuite</span>
          <span>↩️ 90 jours garantie</span>
        </div>
      </div>
    </section>
  );
};

export default BundleOffer;

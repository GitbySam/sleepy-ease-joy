import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Clock, Flame } from "lucide-react";
import sleepMask from "@/assets/sleep-mask.png";

interface UpsellPopupProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const UpsellPopup = ({ open, onClose, onAccept }: UpsellPopupProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[60] w-[92%] max-w-md"
          >
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
              {/* Top banner */}
              <div className="bg-gradient-to-r from-gold to-gold-dark text-primary-foreground text-center py-3 px-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Offre limitée</span>
                </div>
                <p className="text-sm font-bold">
                  🎧 WAIT! Complétez votre routine sommeil & économisez 50%
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-primary-foreground z-10"
              >
                <X size={16} />
              </button>

              <div className="p-5 space-y-4">
                {/* Alert box */}
                <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-2">
                  <span className="text-gold mt-0.5">💡</span>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Optimisez votre sommeil !</strong> Le coussin Sleepenzy + le bandeau musical créent l'environnement parfait pour un endormissement rapide et profond.
                  </p>
                </div>

                {/* Product card */}
                <div className="border border-border rounded-xl p-4 bg-background">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="bg-destructive text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                      -50% AUJOURD'HUI
                    </span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-muted/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img src={sleepMask} alt="Bandeau Sommeil MP3" className="w-20 h-20 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Bandeau Sommeil MP3 Sleepenzy™</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-gold">19,90€</span>
                        <span className="text-sm text-muted-foreground line-through">39,90€</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Flame size={12} className="text-destructive" />
                        <span className="text-xs text-destructive font-semibold">Plus que 4 à ce prix !</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">🎧 Bluetooth 5.0</span>
                    <span className="flex items-center gap-1">🔋 10h autonomie</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  {[
                    "Écoutez musique, ASMR ou bruit blanc pour dormir",
                    "Ultra-fin & confortable — ne gêne pas le sommeil",
                    "Économisez 20,00€ vs achat séparé",
                    "Livraison GRATUITE avec votre commande",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onAccept}
                  className="w-full bg-gold text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-gold-glow uppercase tracking-wider"
                >
                  ✅ OUI ! Ajouter le bandeau — 19,90€
                </motion.button>

                {/* Decline */}
                <button
                  onClick={onClose}
                  className="w-full text-center text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  Non merci, je paierai le prix fort plus tard (39,90€)
                </button>

                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  🔒 Cette offre exclusive expire à la fermeture de cette fenêtre
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpsellPopup;

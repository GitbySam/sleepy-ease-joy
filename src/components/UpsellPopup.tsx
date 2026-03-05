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
            className="fixed inset-0 bg-black/60 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md">
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
              {/* Top banner */}
              <div className="bg-gradient-to-r from-gold to-gold-dark text-primary-foreground text-center py-3 px-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Limited offer</span>
                </div>
                <p className="text-sm font-bold">
                  🎧 Complete your anti-embarrassment kit & save 50%
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
                    <strong className="text-foreground">Full protection!</strong> The pillow prevents head drops. The headband blocks out light so you sleep deeper — without the zombie face.
                  </p>
                </div>

                {/* Product card */}
                <div className="border border-border rounded-xl p-4 bg-background">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="bg-destructive text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                      -50% TODAY
                    </span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-muted/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img src={sleepMask} alt="Sleep Headband MP3" className="w-20 h-20 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Sleep&zy™ MP3 Sleep Headband</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-gold">$19.90</span>
                        <span className="text-sm text-muted-foreground line-through">$39.90</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Flame size={12} className="text-destructive" />
                        <span className="text-xs text-destructive font-semibold">Only 4 left at this price!</span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">🎧 Bluetooth 5.0</span>
                    <span className="flex items-center gap-1">🔋 10h battery</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  {[
                    "Listen to music, ASMR, or white noise to fall asleep",
                    "Ultra-thin & comfortable — won't disrupt your sleep",
                    "Save $20.00 vs buying separately",
                    "FREE shipping with your order",
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
                  ✅ YES! Add the headband — $19.90
                </motion.button>

                {/* Decline */}
                <button
                  onClick={onClose}
                  className="w-full text-center text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  No thanks, I'll pay full price later ($39.90)
                </button>

                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  🔒 This exclusive offer expires when you close this window
                </p>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpsellPopup;

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ShieldCheck, X } from "lucide-react";

const INACTIVITY_TIMEOUT = 30000; // 30 seconds

const InactivityPopup = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const resetTimer = useCallback(() => {
    // handled via effect
  }, []);

  useEffect(() => {
    if (dismissed) return;

    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setShow(true), INACTIVITY_TIMEOUT);
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
  };

  const handleClaim = () => {
    setShow(false);
    setDismissed(true);
    const offerSection = document.getElementById("offer");
    offerSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed left-1/2 top-1/2 z-[101] w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-[hsl(var(--gold))] via-amber-500 to-amber-600 px-6 pt-8 pb-10 text-center">
              <button
                onClick={handleDismiss}
                className="absolute right-3 top-3 rounded-full bg-white/20 p-1 text-white hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
              {/* Decorative dots */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Gift className="text-white" size={28} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-white mb-1">
                ATTENDEZ !
              </h2>
              <p className="text-white/90 text-sm font-sans-body">
                Offre exclusive rien que pour vous
              </p>
            </div>

            {/* Body */}
            <div className="bg-card px-6 py-6 text-center">
              <div className="mx-auto mb-4 rounded-full bg-gradient-to-r from-[hsl(var(--gold))] to-amber-500 px-6 py-2.5 inline-block">
                <span className="text-white font-bold text-lg tracking-wide">
                  -10% SUPPLÉMENTAIRES
                </span>
              </div>
              <p className="text-muted-foreground text-sm mb-1 font-sans-body">
                Commandez maintenant et bénéficiez d'une
              </p>
              <p className="text-foreground font-semibold text-sm mb-4 font-sans-body">
                réduction supplémentaire de 10% sur votre commande !
              </p>
              <p className="text-xs text-muted-foreground mb-5 flex items-center justify-center gap-1.5">
                ⏰ L'offre expire quand vous quittez cette page
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClaim}
                className="w-full rounded-full bg-dark py-3.5 text-sm font-bold text-white tracking-wide shadow-lg hover:opacity-90 transition-opacity mb-3"
              >
                J'EN PROFITE MAINTENANT
              </motion.button>

              <button
                onClick={handleDismiss}
                className="text-xs text-muted-foreground underline hover:text-foreground transition-colors font-sans-body"
              >
                Non merci, je préfère payer plein tarif
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck size={14} className="text-green-600" />
                <span className="font-sans-body">Paiement sécurisé • Livraison gratuite • Garantie 30 jours</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InactivityPopup;

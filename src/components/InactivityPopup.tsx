import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const INACTIVITY_TIMEOUT = 30000;

const InactivityPopup = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();

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
    navigate("/product?promo=SLEEPZY10");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[380px] z-[100]"
        >
          <div className="bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden">
            {/* Soft top accent */}
            <div className="h-1 bg-gradient-to-r from-[hsl(var(--gold))] to-amber-400" />

            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center">
                  <Tag className="text-[hsl(var(--gold))]" size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-foreground text-base leading-tight">
                    {t("inactivity.title")}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                    {t("inactivity.subtitle")}
                  </p>

                  {/* Offer badge */}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--gold))]/10 px-3 py-1.5">
                    <span className="text-[hsl(var(--gold))] font-bold text-sm">
                      {t("inactivity.extra10")}
                    </span>
                  </div>
                </div>

                {/* Close */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClaim}
                  className="flex-1 bg-black text-primary-foreground py-2.5 rounded-xl text-sm font-semibold shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                >
                  {t("inactivity.cta")}
                  <ArrowRight size={14} />
                </motion.button>

                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans-body"
                >
                  {t("inactivity.decline")}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InactivityPopup;

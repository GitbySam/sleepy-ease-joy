import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useViewerCount } from "@/hooks/useViewerCount";

const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);
  const { t, lang } = useLanguage();
  const viewerCount = useViewerCount();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero (~500px)
      const pastHero = window.scrollY > 500;
      // Hide when bundle offer section is in viewport
      const offerSection = document.getElementById("offer");
      let offerVisible = false;
      if (offerSection) {
        const rect = offerSection.getBoundingClientRect();
        offerVisible = rect.top < window.innerHeight && rect.bottom > 0;
      }
      setVisible(pastHero && !offerVisible);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currencySymbol = lang === "en" ? "$" : "€";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          <div className="bg-card/95 backdrop-blur-md border-t border-border px-4 pt-2 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
            <p className="text-[11px] text-center text-muted-foreground mb-2">
              🔥 {t("sticky.viewing").replace("{count}", String(viewerCount))}
            </p>
            <Link to="/product" className="block">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gold text-primary-foreground text-center py-3.5 rounded-full font-bold shadow-gold-glow flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} />
                <span className="text-sm uppercase tracking-wider">{t("sticky.cta")}</span>
                <span className="text-sm font-normal ml-1">
                  <span className="line-through opacity-60">{currencySymbol}69.90</span>{" "}
                  <span className="font-bold">{currencySymbol}34.95</span>
                </span>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyMobileCTA;

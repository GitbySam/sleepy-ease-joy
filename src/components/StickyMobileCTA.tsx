import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { useViewerCount } from "@/hooks/useViewerCount";

const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  const { prices, formatPrice } = useMarket();
  const viewerCount = useViewerCount();

  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();

    const showSticky = () => setVisible(true);
    const hideSticky = () => setVisible(false);

    const isOfferCtaVisible = () => {
      const offerSection = document.getElementById("offer");
      if (!offerSection) return false;
      const rect = offerSection.getBoundingClientRect();
      return rect.bottom - 200 < window.innerHeight && rect.bottom > 0;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const scrollSpeed = Math.abs(currentScrollY - lastScrollY) / (currentTime - lastScrollTime);

      // Ne jamais montrer si on est encore dans le Hero ou si le CTA bundle est visible
      const pastHero = currentScrollY > 100;
      if (!pastHero || isOfferCtaVisible()) {
        hideSticky();
        if (inactivityTimer) clearTimeout(inactivityTimer);
        lastScrollY = currentScrollY;
        lastScrollTime = currentTime;
        return;
      }

      // Intention de quitter : scroll rapide vers le haut
      const scrollingUpFast = currentScrollY < lastScrollY && scrollSpeed > 1.5;
      if (scrollingUpFast) {
        showSticky();
        if (inactivityTimer) clearTimeout(inactivityTimer);
        lastScrollY = currentScrollY;
        lastScrollTime = currentTime;
        return;
      }

      // Inactivité : reset le timer à chaque scroll
      hideSticky();
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (!isOfferCtaVisible()) showSticky();
      }, 3000);

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, []);

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
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const offer = document.getElementById("offer");
                if (offer) offer.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full bg-gold text-primary-foreground text-center py-2.5 rounded-full font-bold shadow-gold-glow flex flex-col items-center justify-center gap-0.5 cursor-pointer leading-tight"
            >
              <span className="flex items-center justify-center gap-2">
                <ShoppingBag size={16} />
                <span className="text-[13px] uppercase tracking-wide">{t("sticky.cta")}</span>
              </span>
              <span className="text-[11px] font-normal whitespace-nowrap">
                <span className="line-through opacity-60">{formatPrice(prices.oldSingle)}</span>{" "}
                <span className="font-bold">{formatPrice(prices.single)}</span>
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyMobileCTA;

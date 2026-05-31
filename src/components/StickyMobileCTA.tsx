import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";

const StickyMobileCTA = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();
  const { prices, formatPrice } = useMarket();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastScrollTime = Date.now();

    const showSticky = () => setVisible(true);
    const hideSticky = () => setVisible(false);

    const isOfferCtaVisible = () => {
      const section =
        document.getElementById("offer") || document.getElementById("products");
      if (!section) return false;
      const rect = section.getBoundingClientRect();
      return rect.top < window.innerHeight - 150 && rect.bottom > 150;
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const currentTime = Date.now();
      const scrollSpeed = Math.abs(currentScrollY - lastScrollY) / (currentTime - lastScrollTime);

      const pastHero = currentScrollY > 100;
      if (!pastHero) {
        hideSticky();
      } else if (isOfferCtaVisible()) {
        // L'utilisateur voit déjà la section produit/offer → masquer
        hideSticky();
      } else {
        // Sinon visible en permanence dès qu'on a quitté le hero
        showSticky();
      }

      // Intention de quitter : scroll rapide vers le haut → forcer l'affichage
      const scrollingUpFast = currentScrollY < lastScrollY && scrollSpeed > 1.5;
      if (pastHero && scrollingUpFast) showSticky();

      lastScrollY = currentScrollY;
      lastScrollTime = currentTime;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    const target =
      document.getElementById("offer") || document.getElementById("products");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (location.pathname !== "/product") {
      navigate("/product");
    }
  };

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
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={handleClick}
              className="w-full bg-black text-primary-foreground text-center py-2.5 rounded-full font-bold shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center gap-0.5 cursor-pointer leading-tight"
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

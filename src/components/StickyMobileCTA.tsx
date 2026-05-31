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
    const handleScroll = () => {
      // Visible dès qu'on a quitté le hero. Reste affiché tant qu'on n'y revient pas.
      setVisible(window.scrollY > 400);
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

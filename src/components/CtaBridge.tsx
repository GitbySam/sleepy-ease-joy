import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { useQuickAdd } from "@/hooks/useQuickAdd";

const CtaBridge = () => {
  const { t } = useLanguage();
  const { prices, formatPrice } = useMarket();
  const { quickAdd, loading } = useQuickAdd();

  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-5"
        >
          <p className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {t("ctaBridge.title")}
          </p>
          <p className="text-muted-foreground font-sans-body text-sm md:text-base">
            {t("ctaBridge.desc")}
          </p>
          <motion.button
            type="button"
            onClick={() => quickAdd()}
            disabled={loading}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-8 py-4 rounded-full text-base font-bold shadow-gold-glow uppercase tracking-wider mt-2 disabled:opacity-60"
          >
            {t("ctaBridge.cta")}
            <ArrowRight size={18} />
          </motion.button>
          <p className="text-xs text-muted-foreground">
            <span className="line-through">{formatPrice(prices.oldSingle)}</span>{" "}
            <span className="text-gold font-bold">{formatPrice(prices.single)}</span>{" "}
            — {t("ctaBridge.savings")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaBridge;

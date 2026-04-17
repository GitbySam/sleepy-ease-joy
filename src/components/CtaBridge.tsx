import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const CtaBridge = () => {
  const { t, lang } = useLanguage();
  const currencySymbol = lang === "en" ? "$" : "€";

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
          <motion.span
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-block mt-2"
          >
            <Link
              to="/product"
              className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-8 py-4 rounded-full text-base font-bold shadow-gold-glow uppercase tracking-wider"
            >
              {t("ctaBridge.cta")}
              <ArrowRight size={18} />
            </Link>
          </motion.span>
          <p className="text-xs text-muted-foreground">
            <span className="line-through">{currencySymbol}59.90</span>{" "}
            <span className="text-gold font-bold">{currencySymbol}24.95</span>{" "}
            — {t("ctaBridge.savings")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaBridge;

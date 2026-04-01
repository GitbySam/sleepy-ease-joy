import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const BundleOffer = () => {
  const [selected, setSelected] = useState(2);
  const { t, lang } = useLanguage();

  const currencySymbol = lang === "en" ? "$" : "€";

  const bundles = [
    { qty: 1, label: "1 Sleep&zy", price: `${currencySymbol}34.95`, oldPrice: `${currencySymbol}69.90`, perUnit: `${currencySymbol}34.95${t("bundle.perUnit")}`, tag: null },
    { qty: 2, label: "2 Sleep&zy", price: `${currencySymbol}64.90`, oldPrice: `${currencySymbol}139.80`, perUnit: `${currencySymbol}32.45${t("bundle.perUnit")}`, tag: "BEST SELLER" },
    { qty: 3, label: "3 Sleep&zy", price: `${currencySymbol}69.90`, oldPrice: `${currencySymbol}209.70`, perUnit: `${currencySymbol}23.30${t("bundle.perUnit")}`, tag: "BEST VALUE" },
  ];

  const titleParts = t("bundle.title").split(/<gold>|<\/gold>/);
  const socialParts = t("bundle.socialProof").split(/<bold>|<\/bold>/);

  return (
    <section id="offer" className="py-14 md:py-24 bg-card">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            {t("bundle.subtitle")}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
            {titleParts[0]}<span className="text-gold italic">{titleParts[1]}</span>{titleParts[2]}
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-10 italic font-semibold"
        >
          <span className="font-bold">{socialParts[1]}</span>{socialParts[2]}
        </motion.p>

        <div className="space-y-4 mb-8">
          {bundles.map((b, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(i)}
              className={`w-full rounded-2xl p-5 border-2 transition-all text-left relative ${
                selected === i
                  ? "border-gold bg-gold/5 shadow-lg"
                  : "border-border bg-card hover:border-gold/40"
              }`}
            >
              {b.tag && (
                <span className="absolute -top-3 right-4 bg-gold text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {b.tag}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected === i ? "border-gold bg-gold" : "border-border"
                    }`}
                  >
                    <AnimatePresence>
                      {selected === i && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check size={14} className="text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{b.label}</p>
                    <p className="text-xs text-muted-foreground">{b.perUnit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{b.price}</p>
                  <p className="text-xs text-muted-foreground line-through">{b.oldPrice}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse-dot" />
            <span className="text-sm font-semibold text-destructive">{t("bundle.lowStock")}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-destructive h-full rounded-full animate-progress-pulse" style={{ width: "12%" }} />
          </div>
        </motion.div>

        <Link to={`/product?bundle=${bundles[selected].qty}`}>
          <motion.span
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="block w-full bg-gold text-primary-foreground text-center py-4 rounded-full text-lg font-bold shadow-gold-glow uppercase tracking-wider"
          >
            {t("bundle.cta")}
          </motion.span>
        </Link>

        <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
          <span>{t("bundle.securePayment")}</span>
          <span>{t("bundle.freeShipping")}</span>
          <span>{t("bundle.guarantee")}</span>
        </div>
      </div>
    </section>
  );
};

export default BundleOffer;

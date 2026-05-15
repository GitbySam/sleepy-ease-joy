import { motion } from "framer-motion";
import { ShieldCheck, Heart, MoveHorizontal, Sparkles, Package, Eye, Plane, Check, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const ProductBenefits = () => {
  const { t } = useLanguage();

  const items = [
    { icon: ShieldCheck, key: "jaw" },
    { icon: Heart, key: "neck" },
    { icon: MoveHorizontal, key: "positions", highlight: true },
    { icon: Sparkles, key: "wakeup" },
    { icon: Package, key: "compact" },
    { icon: Eye, key: "discreet" },
    { icon: Plane, key: "multimodal" },
  ] as const;

  const titleParts = t("product.benefits.title").split(/<gold>|<\/gold>/);

  const compareRows = [
    { before: t("product.benefits.compare.row1.before"), after: t("product.benefits.compare.row1.after") },
    { before: t("product.benefits.compare.row2.before"), after: t("product.benefits.compare.row2.after") },
    { before: t("product.benefits.compare.row3.before"), after: t("product.benefits.compare.row3.after") },
  ];

  return (
    <section className="gradient-section-warm py-14 md:py-20 mt-10 md:mt-14 -mx-4 px-4 rounded-2xl">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-14"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3 font-sans-body">
            {t("product.benefits.eyebrow")}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {titleParts[0]}
            <span className="text-gold italic">{titleParts[1]}</span>
            {titleParts[2]}
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans-body">
            {t("product.benefits.intro")}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`bg-card rounded-2xl p-5 md:p-6 border transition-shadow ${
                  item.highlight ? "border-gold/60 shadow-md" : "border-border"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  item.highlight ? "bg-gold text-primary-foreground" : "bg-gold/10 text-gold"
                }`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2 text-foreground">
                  {t(`product.benefits.items.${item.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans-body">
                  {t(`product.benefits.items.${item.key}.desc`)}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Mini comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 md:mt-14 bg-card border border-border rounded-2xl p-5 md:p-8"
        >
          <h3 className="text-center font-serif text-xl md:text-2xl font-semibold text-foreground mb-6">
            {t("product.benefits.compare.title")}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div className="space-y-3">
              <p className="text-center text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("product.benefits.compare.before")}
              </p>
              {compareRows.map((r, i) => (
                <div key={i} className="flex items-start gap-2 bg-muted/40 rounded-lg p-3">
                  <X size={16} className="text-destructive shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-muted-foreground font-sans-body">{r.before}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-center text-xs md:text-sm font-bold uppercase tracking-wider text-gold">
                {t("product.benefits.compare.after")}
              </p>
              {compareRows.map((r, i) => (
                <div key={i} className="flex items-start gap-2 bg-gold/5 border border-gold/20 rounded-lg p-3">
                  <Check size={16} className="text-gold shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-foreground font-sans-body font-medium">{r.after}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductBenefits;
import { motion } from "framer-motion";
import { Truck, ShieldCheck, RotateCcw, Lock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const TrustBar = () => {
  const { t } = useLanguage();

  const badges = [
    { icon: Truck, label: t("trustBar.freeShipping") },
    { icon: ShieldCheck, label: t("trustBar.securePayment") },
    { icon: RotateCcw, label: t("trustBar.guarantee") },
    { icon: Lock, label: t("trustBar.ssl") },
  ];

  return (
    <section className="bg-card border-y border-border py-4 md:py-5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 md:gap-10"
        >
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground">
              <b.icon size={16} className="text-gold shrink-0" />
              <span className="text-xs md:text-sm font-sans-body whitespace-nowrap">{b.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBar;

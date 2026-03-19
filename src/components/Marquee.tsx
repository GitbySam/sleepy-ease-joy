import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const logos = ["VOGUE", "ELLE", "GQ", "Forbes", "TechCrunch", "Cosmopolitan", "Marie Claire", "Travel + Leisure"];

const Marquee = () => {
  const { t } = useLanguage();

  return (
    <section className="bg-warm-gray py-8 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative"
      >
        <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
          {t("marquee.asSeenIn")}
        </p>
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex items-center gap-16 whitespace-nowrap">
            {[...logos, ...logos].map((logo, i) => (
              <span
                key={i}
                className="text-2xl font-serif font-bold text-muted-foreground/40 select-none"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Marquee;

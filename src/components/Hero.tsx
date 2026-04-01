import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import pillowHero from "@/assets/product-pillow-grey.png";
import { useLanguage } from "@/i18n/LanguageContext";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const Hero = () => {
  const { t } = useLanguage();

  return (
    <section className="gradient-hero min-h-[auto] md:min-h-[80vh] flex items-center pt-28 md:pt-32 pb-8 md:pb-16">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-6 md:gap-12 items-center">
        {/* Image first on mobile for compact layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex justify-center order-first md:order-last"
        >
          <div className="animate-float">
            <img
              src={pillowHero}
              alt="Sleep&zy - Ergonomic cervical pillow"
              className="w-48 md:w-full max-w-md drop-shadow-2xl"
            />
          </div>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="space-y-4 md:space-y-6"
        >
          <motion.p variants={fadeUp} className="text-xs md:text-sm font-sans-body uppercase tracking-[0.25em] text-muted-foreground">
            {t("hero.subtitle")}
          </motion.p>
          <motion.h1 variants={fadeUp} className="text-3xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.1] text-foreground">
            {t("hero.title1")} <span className="text-gold italic">{t("hero.title2")}</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-sm md:text-lg text-muted-foreground font-sans-body leading-relaxed max-w-lg">
            {t("hero.desc")}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 items-start">
            <Link to="/product">
              <motion.span
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gold text-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-full text-sm md:text-base font-bold shadow-gold-glow inline-flex items-center gap-2 uppercase tracking-wider"
              >
                {t("hero.cta")}
              </motion.span>
            </Link>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <span className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                   <span key={i} className="inline-flex items-center justify-center w-5 h-5 md:w-7 md:h-7 bg-success rounded-[3px]">
                     <svg viewBox="0 0 24 24" className="w-3 h-3 md:w-4 md:h-4 fill-white">
                       <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 6.9L12 17.3 5.7 20.7 7 13.8 2 9.2l7.1-.9L12 2z" />
                     </svg>
                   </span>
                 ))}
              </span>
              <span>{t("hero.reviews")}</span>
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <ArrowDown size={14} className="animate-bounce" />
            {t("hero.guarantee")}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

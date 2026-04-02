import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
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
    <>
      {/* MOBILE Hero: image on top, content below */}
      <section className="md:hidden flex flex-col">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-full aspect-[16/10] overflow-hidden"
        >
          <img
            src={heroBanner}
            alt="Sleep&zy pillow in use on airplane"
            className="w-full h-full object-cover object-top"
          />
        </motion.div>

        <div className="px-5 py-6 bg-background">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <motion.p variants={fadeUp} className="text-[10px] font-sans-body uppercase tracking-[0.25em] text-muted-foreground">
              {t("hero.subtitle")}
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-2xl font-serif font-bold leading-[1.15] text-foreground">
              {t("hero.title1")} <span className="text-gold italic">{t("hero.title2")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-sm text-muted-foreground font-sans-body leading-relaxed">
              {t("hero.desc")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col gap-3">
              <Link to="/product">
                <motion.span
                  whileTap={{ scale: 0.95 }}
                  className="bg-gold text-primary-foreground px-6 py-3 rounded-full text-sm font-bold shadow-gold-glow inline-flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                >
                  {t("hero.cta")}
                </motion.span>
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="inline-flex items-center justify-center w-5 h-5 bg-success rounded-[3px]">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                        <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 6.9L12 17.3 5.7 20.7 7 13.8 2 9.2l7.1-.9L12 2z" />
                      </svg>
                    </span>
                  ))}
                </span>
                <span>{t("hero.reviews")}</span>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowDown size={14} className="animate-bounce" />
              {t("hero.guarantee")}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* DESKTOP Hero: banner background with text overlay */}
      <section className="hidden md:flex relative min-h-[85vh] items-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={heroBanner}
            alt="Sleep&zy pillow in use on airplane"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </motion.div>

        <div className="container mx-auto px-6 relative z-10 pt-32 pb-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-6 max-w-xl"
          >
            <motion.p variants={fadeUp} className="text-sm font-sans-body uppercase tracking-[0.25em] text-muted-foreground">
              {t("hero.subtitle")}
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-6xl lg:text-7xl font-serif font-bold leading-[1.1] text-foreground">
              {t("hero.title1")} <span className="text-gold italic">{t("hero.title2")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-muted-foreground font-sans-body leading-relaxed max-w-lg">
              {t("hero.desc")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-row gap-3 items-center">
              <Link to="/product">
                <motion.span
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gold text-primary-foreground px-8 py-4 rounded-full text-base font-bold shadow-gold-glow inline-flex items-center gap-2 uppercase tracking-wider"
                >
                  {t("hero.cta")}
                </motion.span>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="inline-flex items-center justify-center w-7 h-7 bg-success rounded-[3px]">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
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
    </>
  );
};

export default Hero;

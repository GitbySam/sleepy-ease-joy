import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import demoVideo from "@/assets/demo-video.mp4";
import { useLanguage } from "@/i18n/LanguageContext";
import { useViewerCount } from "@/hooks/useViewerCount";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const StarRating = ({ size = "small" }: { size?: "small" | "large" }) => {
  const dim = size === "large" ? "w-5 h-5" : "w-4 h-4";
  const box = size === "large" ? "w-6 h-6" : "w-5 h-5";
  return (
    <span className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`inline-flex items-center justify-center ${box} bg-success rounded-[3px]`}>
          <svg viewBox="0 0 24 24" className={`${dim} fill-white`}>
            <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 6.9L12 17.3 5.7 20.7 7 13.8 2 9.2l7.1-.9L12 2z" />
          </svg>
        </span>
      ))}
    </span>
  );
};

const Hero = () => {
  const { t } = useLanguage();
  const viewerCount = useViewerCount();

  return (
    <>
      {/* ========== MOBILE HERO ========== */}
      <section className="md:hidden flex flex-col pt-[56px]">
        {/* Image — compact 4:3 with badge overlay */}
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-full aspect-[4/3] overflow-hidden"
        >
          <video
            src={demoVideo}
            poster={heroBanner}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center"
          />
          {/* Best Seller badge */}
          <span className="absolute top-3 left-3 bg-gold text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
            {t("hero.badge")}
          </span>
          {/* Live viewers */}
          <span className="absolute bottom-3 left-3 bg-foreground/80 text-background text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            🔥 {viewerCount} {t("hero.viewingNow")}
          </span>
        </motion.div>

        {/* Content */}
        <div className="px-5 py-4 bg-background">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {/* Social proof FIRST */}
            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <StarRating size="small" />
              <span className="text-xs text-muted-foreground font-sans-body">{t("hero.reviews")}</span>
            </motion.div>

            {/* Subtitle */}
            <motion.p variants={fadeUp} className="text-[10px] font-sans-body uppercase tracking-[0.25em] text-muted-foreground">
              {t("hero.subtitle")}
            </motion.p>

            {/* Title — short, punchy */}
            <motion.h1 variants={fadeUp} className="text-[22px] font-serif font-bold leading-[1.15] text-foreground">
              {t("hero.title1")} <span className="text-gold italic">{t("hero.title2")}</span>
            </motion.h1>

            {/* Price anchor */}
            <motion.div variants={fadeUp} className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-gold font-sans-body">{t("hero.priceNew")}</span>
              <span className="text-sm text-muted-foreground line-through font-sans-body">{t("hero.priceOld")}</span>
              <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">-54%</span>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp}>
              <Link to="/product" className="block">
                <motion.span
                  whileTap={{ scale: 0.95 }}
                  className="bg-gold text-primary-foreground px-6 py-3.5 rounded-full text-sm font-bold shadow-gold-glow inline-flex items-center justify-center gap-2 uppercase tracking-wider w-full"
                >
                  {t("hero.cta")}
                </motion.span>
              </Link>
            </motion.div>

            {/* Micro-reassurances */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground font-sans-body">
              <span>{t("hero.freeShipping")}</span>
              <span className="w-px h-3 bg-border" />
              <span>{t("hero.securePayment")}</span>
              <span className="w-px h-3 bg-border" />
              <span>✅ {t("hero.guarantee")}</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== DESKTOP HERO ========== */}
      <section className="hidden md:flex relative min-h-[85vh] items-center overflow-hidden">
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <video
            src={demoVideo}
            poster={heroBanner}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-[15%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
        </motion.div>

        <div className="container mx-auto px-6 relative z-10 pt-32 pb-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-5 max-w-xl [&_h1]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] [&_p]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          >
            {/* Social proof FIRST */}
            <motion.div variants={fadeUp} className="flex items-center gap-2.5">
              <StarRating size="large" />
              <span className="text-sm text-muted-foreground font-sans-body">{t("hero.reviews")}</span>
            </motion.div>

            {/* Live viewers */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-foreground/10 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                🔥 {viewerCount} {t("hero.viewingNow")}
              </span>
            </motion.div>

            <motion.p variants={fadeUp} className="text-sm font-sans-body uppercase tracking-[0.25em] text-muted-foreground">
              {t("hero.subtitle")}
            </motion.p>

            <motion.h1 variants={fadeUp} className="text-6xl lg:text-7xl font-serif font-bold leading-[1.1] text-foreground">
              {t("hero.title1")} <span className="text-gold italic">{t("hero.title2")}</span>
            </motion.h1>

            {/* Price anchor */}
            <motion.div variants={fadeUp} className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gold font-sans-body">{t("hero.priceNew")}</span>
              <span className="text-lg text-muted-foreground line-through font-sans-body">{t("hero.priceOld")}</span>
              <span className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1 rounded-full uppercase">-54%</span>
            </motion.div>

            {/* CTA */}
            <motion.div variants={fadeUp} className="flex flex-row gap-4 items-center">
              <Link to="/product">
                <motion.span
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gold text-primary-foreground px-8 py-4 rounded-full text-base font-bold shadow-gold-glow inline-flex items-center gap-2 uppercase tracking-wider"
                >
                  {t("hero.cta")}
                </motion.span>
              </Link>
            </motion.div>

            {/* Micro-reassurances */}
            <motion.div variants={fadeUp} className="flex items-center gap-4 text-xs text-muted-foreground font-sans-body pt-1">
              <span>{t("hero.freeShipping")}</span>
              <span className="w-px h-3 bg-border" />
              <span>{t("hero.securePayment")}</span>
              <span className="w-px h-3 bg-border" />
              <span>✅ {t("hero.guarantee")}</span>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Hero;

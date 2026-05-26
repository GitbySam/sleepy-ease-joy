import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
const heroBanner = "/hero-banner.webp";
const demoVideo = "/demo-video.mp4";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { useViewerCount } from "@/hooks/useViewerCount";
import { useQuickAdd } from "@/hooks/useQuickAdd";

/**
 * Deferred video: shows poster immediately, loads video only after
 * the component mounts + a short delay (better LCP on mobile).
 */
const DeferredVideo = ({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className: string;
}) => {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Wait for idle or 1.5s to start loading the video
    const id = typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback(() => setReady(true), { timeout: 1500 })
      : setTimeout(() => setReady(true), 1500) as unknown as number;
    return () => {
      if (typeof cancelIdleCallback !== "undefined") cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  const handleCanPlay = useCallback(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  if (!ready) {
    return <img src={poster} alt="" className={className} loading="eager" fetchPriority="high" />;
  }

  return (
    <video
      ref={videoRef}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      onCanPlay={handleCanPlay}
      className={className}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

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
  const { prices, formatPrice } = useMarket();
  const viewerCount = useViewerCount();

  return (
    <>
      {/* ========== MOBILE HERO ========== */}
      <section className="md:hidden flex flex-col pt-[90px]">
        {/* Video — full-width, no animation delay */}
        <div className="relative w-full aspect-square overflow-hidden">
          <DeferredVideo
            src={demoVideo}
            poster={heroBanner}
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Overlaid content — instant, no animations */}
          <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
            {/* Stars — compact proof */}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
              <StarRating size="small" />
              <span className="text-[11px] text-white/80 font-sans-body break-words">{t("hero.reviews")}</span>
            </div>

            {/* Live viewers — urgence sociale */}
            <span className="inline-flex max-w-full items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full tracking-normal">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
              <span className="break-words">🔥 {viewerCount} {t("hero.viewingNow")}</span>
            </span>

            {/* Subtitle */}
            <p className="text-[11px] font-sans-body uppercase tracking-[0.2em] text-white/70">
              {t("hero.subtitle")}
            </p>

            {/* Title — short, high contrast */}
            <h1 className="text-[22px] font-serif font-bold leading-[1.15] text-white">
              {t("hero.title1")} <span className="text-gold italic">{t("hero.title2")}</span>
            </h1>
          </div>
        </div>

        {/* CTA zone — visible immediately, no delay */}
        <div className="px-5 py-4 bg-background space-y-3">
          <Link to="/product" className="block">
            <span className="bg-gold text-primary-foreground px-6 py-4 rounded-full text-sm font-bold shadow-gold-glow inline-flex items-center justify-center gap-2 tracking-wider w-full">
              {t("hero.cta")}
            </span>
          </Link>

          {/* Price */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-base font-bold text-foreground font-sans-body">{formatPrice(prices.single)}</span>
            <span className="text-sm text-muted-foreground line-through font-sans-body">{formatPrice(prices.oldSingle)}</span>
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full leading-none tracking-normal whitespace-nowrap">-50%</span>
          </div>

          {/* Micro-reassurances — below CTA, secondary */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground font-sans-body tracking-normal">
            <span>{t("hero.freeShipping")}</span>
            <span className="w-px h-3 bg-border" />
            <span>{t("hero.securePayment")}</span>
            <span className="w-px h-3 bg-border" />
            <span>✅ {t("hero.guarantee")}</span>
          </div>
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
          <DeferredVideo
            src={demoVideo}
            poster={heroBanner}
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

            <motion.h1 variants={fadeUp} className="text-4xl lg:text-5xl font-serif font-bold leading-[1.1] text-foreground">
              {t("hero.title1")} <span className="text-gold italic">{t("hero.title2")}</span>
            </motion.h1>

            {/* CTA */}
            <motion.div variants={fadeUp} className="flex flex-row gap-4 items-center">
              <Link to="/product">
                <motion.span
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gold text-primary-foreground px-8 py-4 rounded-full text-base font-bold shadow-gold-glow inline-flex items-center gap-2 tracking-wider"
                >
                  {t("hero.cta")}
                </motion.span>
              </Link>
            </motion.div>

            {/* Price anchor */}
            <motion.div variants={fadeUp} className="flex items-baseline gap-3">
              <span className="text-xl font-bold text-foreground font-sans-body">{formatPrice(prices.single)}</span>
              <span className="text-base text-muted-foreground line-through font-sans-body">{formatPrice(prices.oldSingle)}</span>
              <span className="bg-red-500/10 text-red-500 text-xs font-bold px-2.5 py-1 rounded-full uppercase leading-none tracking-normal whitespace-nowrap">-50%</span>
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

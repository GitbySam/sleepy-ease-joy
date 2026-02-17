import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import pillowHero from "@/assets/pillow-hero.png";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const Hero = () => (
  <section className="gradient-hero min-h-screen flex items-center pt-32 pb-16">
    <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.p variants={fadeUp} className="text-sm font-sans-body uppercase tracking-[0.25em] text-muted-foreground">
          Coussin cervical ergonomique
        </motion.p>
        <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-[1.1] text-foreground">
          Dormez comme en <span className="text-gold italic">Première Classe.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-lg text-muted-foreground font-sans-body leading-relaxed max-w-lg">
          Le coussin de voyage révolutionnaire qui maintient votre tête en place.
          Fini les réveils en sursaut et les douleurs cervicales.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 items-start">
          <motion.a
            href="#offer"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gold text-primary-foreground px-8 py-4 rounded-full text-base font-bold shadow-gold-glow inline-flex items-center gap-2 uppercase tracking-wider"
          >
            Acheter maintenant — 50% OFF
          </motion.a>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-gold">★</span>
              ))}
            </span>
            <span>4.9/5 — 12 000+ avis</span>
          </div>
        </motion.div>
        <motion.div variants={fadeUp} className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <ArrowDown size={14} className="animate-bounce" />
          Garantie 90 jours satisfait ou remboursé
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="flex justify-center"
      >
        <div className="animate-float">
          <img
            src={pillowHero}
            alt="Sleepenzy - Coussin cervical ergonomique"
            className="w-full max-w-md drop-shadow-2xl"
          />
        </div>
      </motion.div>
    </div>
  </section>
);

export default Hero;

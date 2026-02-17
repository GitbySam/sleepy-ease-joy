import { motion } from "framer-motion";
import { Shield, Wind, Moon, Feather } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Soutien cervical 360°",
    desc: "Maintient l'alignement naturel de votre colonne cervicale pour zéro douleur au réveil.",
  },
  {
    icon: Moon,
    title: "Sommeil profond REM",
    desc: "Élimine le réflexe de micro-réveil en empêchant la tête de basculer au-delà de 15°.",
  },
  {
    icon: Wind,
    title: "Tissu respirant",
    desc: "Matière douce et aérée, sans compression. Aucune sensation d'étouffement ni de chaleur.",
  },
  {
    icon: Feather,
    title: "Ultra-léger & compact",
    desc: "Se porte comme un foulard, se range dans un sac à main. Seulement 180g.",
  },
];

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Benefits = () => (
  <section id="benefits" className="gradient-section-warm py-24">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Conçu par des spécialistes du sommeil
        </p>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
          Pourquoi Sleepenzy est <span className="text-gold italic">différent</span>
        </h2>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((b, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={cardVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ y: -8, boxShadow: "0 20px 40px -12px hsl(43 56% 52% / 0.15)" }}
            className="bg-card rounded-2xl p-8 border border-border transition-shadow cursor-default"
          >
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
              <b.icon size={24} className="text-gold" />
            </div>
            <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">{b.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Benefits;

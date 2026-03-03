import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";

const testimonials = [
  {
    name: "Marie L.",
    role: "Voyageuse fréquente",
    text: "J'ai testé TOUS les coussins du marché. Sleepenzy est le premier qui empêche vraiment ma tête de basculer. J'ai dormi 6h d'affilée sur mon vol pour Tokyo !",
    stars: 5,
  },
  {
    name: "Thomas R.",
    role: "Consultant",
    text: "Après mon opération cervicale, je pensais ne plus jamais voyager confortablement. Ce coussin a tout changé. 12h de vol, zéro douleur.",
    stars: 5,
  },
  {
    name: "Sophie M.",
    role: "Hôtesse de l'air",
    text: "En tant que crew, je vole 80h par mois. C'est le seul qui fonctionne vraiment. Je le recommande à tous mes passagers.",
    stars: 5,
  },
  {
    name: "Lucas D.",
    role: "Digital Nomad",
    text: "Ultra-léger et compact, il se range dans mon sac à dos. En plus il ressemble à une écharpe donc c'est discret. Game changer.",
    stars: 5,
  },
  {
    name: "Camille B.",
    role: "Maman de 3 enfants",
    text: "Je n'arrivais jamais à dormir en voiture. Avec Sleepenzy, j'ai enfin pu me reposer pendant que mon mari conduisait. Quel soulagement !",
    stars: 5,
  },
];

const Testimonials = () => (
  <section id="testimonials" className="py-24 gradient-section-warm">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          +12 000 voyageurs satisfaits
        </p>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
          Ce qu'ils en <span className="text-gold italic">disent</span>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          className="pb-12"
        >
          {testimonials.map((t, i) => (
            <SwiperSlide key={i}>
              <div className="bg-card rounded-2xl p-8 border border-border h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <span key={j} className="text-success text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1 mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
    </div>
  </section>
);

export default Testimonials;

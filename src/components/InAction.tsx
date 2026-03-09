import { motion } from "framer-motion";
import lifestyleAirplane from "@/assets/lifestyle-airplane.jpg";
import lifestyleTrain from "@/assets/lifestyle-train.jpg";
import lifestyleCar from "@/assets/lifestyle-car.jpg";

const scenes = [
  { img: lifestyleAirplane, label: "✈️ In-flight", caption: "Window seat. Zero embarrassment." },
  { img: lifestyleTrain, label: "🚄 On the train", caption: "Head up. Dignity intact." },
  { img: lifestyleCar, label: "🚗 Road trip", caption: "Passenger seat naps, perfected." },
];

const InAction = () => (
  <section className="py-20 gradient-section-warm">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-14"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Wherever you travel
        </p>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
          Sleep with <span className="text-gold italic">dignity.</span> Everywhere.
        </h2>
      </motion.div>

      <div className="flex gap-4 max-w-5xl mx-auto">
        {scenes.map((scene, i) => (
          <motion.div
            key={scene.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            className="group relative overflow-hidden rounded-2xl shadow-lg"
          >
            <div className="aspect-[3/4] sm:aspect-[4/3] overflow-hidden">
              <img
                src={scene.img}
                alt={scene.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
              <span className="text-xs uppercase tracking-widest text-white/90 font-sans-body leading-none block drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {scene.label}
              </span>
              <p className="text-sm sm:text-base font-serif font-semibold text-white mt-1 leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {scene.caption}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default InAction;

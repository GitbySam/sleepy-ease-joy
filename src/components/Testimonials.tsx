import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";

const testimonials = [
  {
    name: "Sarah L.",
    role: "Frequent traveler",
    text: "I've tried EVERY pillow on the market. Sleep&zy is the first one that actually keeps my head from falling. I slept 6 hours straight on my flight to Tokyo!",
    stars: 5,
  },
  {
    name: "James R.",
    role: "Business consultant",
    text: "After my cervical surgery, I thought I'd never travel comfortably again. This pillow changed everything. 12-hour flight, zero pain.",
    stars: 5,
  },
  {
    name: "Emily M.",
    role: "Flight attendant",
    text: "As cabin crew, I fly 80+ hours a month. This is the only one that actually works. I recommend it to all my passengers.",
    stars: 5,
  },
  {
    name: "Mike D.",
    role: "Digital nomad",
    text: "Ultra-light and compact — fits right in my backpack. Plus it looks like a scarf so it's super discreet. Absolute game changer.",
    stars: 5,
  },
  {
    name: "Jessica B.",
    role: "Mom of 3",
    text: "I could never sleep in the car. With Sleep&zy, I finally got some rest while my husband was driving on our road trip. What a relief!",
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
          12,000+ happy travelers
        </p>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
          What they're <span className="text-gold italic">saying</span>
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

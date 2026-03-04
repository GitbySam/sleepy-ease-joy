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
    role: "Marketing manager",
    text: "My coworker took a photo of me drooling on a flight. It went VIRAL in the office Slack. Never again. Sleep&zy literally saved my professional reputation.",
    stars: 5,
  },
  {
    name: "James R.",
    role: "Daily commuter",
    text: "I woke up on a stranger's shoulder on the subway. The look on their face... I ordered Sleep&zy that same day. Best $35 I've ever spent.",
    stars: 5,
  },
  {
    name: "Emily M.",
    role: "Mom of 3",
    text: "My kids used to film me sleeping with my mouth wide open on road trips and post it on TikTok. Now I sleep like a normal human being. Thanks Sleep&zy!",
    stars: 5,
  },
  {
    name: "Mike D.",
    role: "Sales executive",
    text: "A client saw me passed out at the airport gate, mouth wide open, head back. I could've died of embarrassment. Got Sleep&zy the next day. Game changer.",
    stars: 5,
  },
  {
    name: "Jessica B.",
    role: "Frequent flyer",
    text: "A flight attendant had to wake me up because I was snoring with my head thrown back. My seatmate was filming. Sleep&zy fixed everything.",
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
          12,000+ dignified sleepers
        </p>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
          Real stories, real <span className="text-gold italic">saves</span>
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

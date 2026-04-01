import { motion } from "framer-motion";
import testimonialMike from "@/assets/testimonial-mike.png";
import testimonialJames from "@/assets/testimonial-james.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { useLanguage } from "@/i18n/LanguageContext";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";

const Testimonials = () => {
  const { t } = useLanguage();

  const testimonials = [
    { name: "Sarah L.", role: t("testimonial.1.role"), text: t("testimonial.1.text"), stars: 5 },
    { name: "James R.", role: t("testimonial.2.role"), text: t("testimonial.2.text"), stars: 5, image: testimonialJames },
    { name: "Emily M.", role: t("testimonial.3.role"), text: t("testimonial.3.text"), stars: 5 },
    { name: "Mike D.", role: t("testimonial.4.role"), text: t("testimonial.4.text"), stars: 5, image: testimonialMike },
    { name: "Jessica B.", role: t("testimonial.5.role"), text: t("testimonial.5.text"), stars: 5 },
  ];

  const titleParts = t("testimonials.title").split(/<gold>|<\/gold>/);

  return (
    <section id="testimonials" className="py-14 md:py-24 bg-dark-blue">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-dark-blue-foreground/50 mb-3">
            {t("testimonials.subtitle")}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-dark-blue-foreground">
            {titleParts[0]}<span className="text-gold italic">{titleParts[1]}</span>{titleParts[2]}
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
                <div className="bg-dark-blue-foreground/5 backdrop-blur-sm rounded-2xl p-8 border border-dark-blue-foreground/10 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_, j) => (
                      <span key={j} className="inline-flex items-center justify-center w-7 h-7 bg-success rounded-[3px]">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                          <path d="M12 2l2.9 6.3L22 9.2l-5 4.6 1.3 6.9L12 17.3 5.7 20.7 7 13.8 2 9.2l7.1-.9L12 2z" />
                        </svg>
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-dark-blue-foreground/90 leading-relaxed flex-1 mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    {t.image ? (
                      <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                        {t.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-dark-blue-foreground">{t.name}</p>
                      <p className="text-xs text-dark-blue-foreground/50">{t.role}</p>
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
};

export default Testimonials;

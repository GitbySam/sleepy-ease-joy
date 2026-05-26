import { motion } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import lifestyleAirplane from "@/assets/lifestyle-airplane.webp";
import lifestyleTrain from "@/assets/lifestyle-train.webp";
import lifestyleCar from "@/assets/lifestyle-car.webp";
const demoVideo = "/demo-video.mp4";
import LazyVideo from "@/components/LazyVideo";
import { useLanguage } from "@/i18n/LanguageContext";

const InAction = () => {
  const { t } = useLanguage();
  const [lightbox, setLightbox] = useState<{ type: "img" | "video"; src: string; caption: string } | null>(null);

  const scenes = [
    { img: lifestyleAirplane, label: t("inAction.flight"), caption: t("inAction.flightCaption") },
    { img: lifestyleTrain, label: t("inAction.train"), caption: t("inAction.trainCaption") },
    { img: lifestyleCar, label: t("inAction.car"), caption: t("inAction.carCaption") },
  ];

  const titleParts = t("inAction.title").split(/<gold>|<\/gold>/);

  return (
    <section id="results" className="py-14 md:py-20 gradient-section-warm">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            {t("inAction.subtitle")}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            {titleParts[0]}<span className="text-gold italic">{titleParts[1]}</span>{titleParts[2]}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:flex gap-3 md:gap-4 max-w-6xl mx-auto">
          {scenes.map((scene, i) => (
            <motion.div
              key={scene.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              onClick={() => setLightbox({ type: "img", src: scene.img, caption: scene.caption })}
              className="group relative overflow-hidden rounded-2xl shadow-lg aspect-[3/4] md:aspect-[4/3] md:flex-1 cursor-zoom-in"
            >
              <img
                src={scene.img}
                alt={scene.caption}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6 sm:px-4 sm:pb-4 sm:pt-8 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                <span className="text-[9px] sm:text-xs uppercase tracking-widest text-white/90 font-sans-body leading-none block drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {scene.label}
                </span>
                <p className="text-[11px] sm:text-base font-serif font-semibold text-white mt-0.5 sm:mt-1 leading-tight sm:leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {scene.caption}
                </p>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 3 * 0.15, duration: 0.6 }}
            onClick={() => setLightbox({ type: "video", src: demoVideo, caption: t("inAction.demoCaption") })}
            className="group relative overflow-hidden rounded-2xl shadow-lg aspect-[3/4] md:aspect-[4/3] md:flex-1 cursor-zoom-in"
          >
            <LazyVideo
              src={demoVideo}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6 sm:px-4 sm:pb-4 sm:pt-8 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
              <span className="text-[9px] sm:text-xs uppercase tracking-widest text-white/90 font-sans-body leading-none block drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {t("inAction.demo")}
              </span>
              <p className="text-[11px] sm:text-base font-serif font-semibold text-white mt-0.5 sm:mt-1 leading-tight sm:leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {t("inAction.demoCaption")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-transparent border-0 shadow-none">
          {lightbox && (
            <div className="relative w-full max-h-[90vh] flex items-center justify-center">
              {lightbox.type === "img" ? (
                <img src={lightbox.src} alt={lightbox.caption} className="w-full h-auto max-h-[90vh] object-contain rounded-xl" />
              ) : (
                <video src={lightbox.src} autoPlay loop muted playsInline controls className="w-full h-auto max-h-[90vh] rounded-xl" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default InAction;

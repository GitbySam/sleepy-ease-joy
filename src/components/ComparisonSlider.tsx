import { motion } from "framer-motion";
import headDropVideo from "@/assets/embarrassing-head-drop.mp4";
import mouthOpen from "@/assets/embarrassing-mouth-open.webp";
import shoulder from "@/assets/embarrassing-shoulder.webp";
import drool from "@/assets/embarrassing-drool.webp";
import { useLanguage } from "@/i18n/LanguageContext";

const ComparisonSlider = () => {
  const { t } = useLanguage();

  const scenes = [
    { img: null, video: headDropVideo, caption: t("comparison.headDrop"), emoji: "😩" },
    { img: mouthOpen, video: null, caption: t("comparison.flyCatcher"), emoji: "😮" },
    { img: shoulder, video: null, caption: t("comparison.strangerCuddler"), emoji: "😳" },
    { img: drool, video: null, caption: t("comparison.droolTrail"), emoji: "🤤" },
  ];

  const titleParts = t("comparison.title").split(/<gold>|<\/gold>/);
  const bottomParts = t("comparison.bottom").split(/<gold>|<\/gold>/);

  return (
    <section id="proof" className="py-14 md:py-24 gradient-section-reverse">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            {t("comparison.subtitle")}
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            {titleParts[0]}<span className="text-gold italic">{titleParts[1]}</span>{titleParts[2]}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {scenes.map((scene, i) => (
            <motion.div
              key={scene.caption}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl shadow-lg"
            >
              <div className="aspect-[3/4] overflow-hidden">
                {scene.video ? (
                  <video
                    src={scene.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={scene.img!}
                    alt={scene.caption}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                <span className="text-2xl mb-1 block">{scene.emoji}</span>
                <p className="text-sm font-serif font-semibold text-primary-foreground">
                  {scene.caption}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8 text-lg text-muted-foreground font-sans-body"
        >
          {bottomParts[0]}<span className="text-gold font-semibold">{bottomParts[1]}</span>{bottomParts[2]}
        </motion.p>
      </div>
    </section>
  );
};

export default ComparisonSlider;

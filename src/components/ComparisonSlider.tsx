import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import beforeImg from "@/assets/before-pillow.jpg";
import afterImg from "@/assets/after-pillow.jpg";

const ComparisonSlider = () => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      setPosition((x / rect.width) * 100);
      if (!hasInteracted) setHasInteracted(true);
    },
    [hasInteracted]
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) handleMove(e.clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { handleMove(e.touches[0].clientX); setHasInteracted(true); };

  return (
    <section id="proof" className="py-24 gradient-section-reverse">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Résultat prouvé cliniquement
          </p>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            Avant <span className="text-gold">&</span> Après
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          ref={containerRef}
          className="relative max-w-2xl mx-auto aspect-[4/5] rounded-2xl overflow-hidden cursor-col-resize select-none shadow-xl"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* After (full background) */}
          <img src={afterImg} alt="Après - Sommeil confortable" className="absolute inset-0 w-full h-full object-cover" />
          
          {/* Before (clipped) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <img src={beforeImg} alt="Avant - Sommeil inconfortable" className="w-full h-full object-cover" />
          </div>

          {/* Slider line */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-primary-foreground/80" style={{ left: `${position}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-card border-2 border-gold flex items-center justify-center shadow-lg">
              <span className="text-gold text-xs font-bold">⟷</span>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 bg-dark/70 text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            AVANT
          </div>
          <div className="absolute top-4 right-4 bg-gold/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            APRÈS
          </div>

          {/* Hint */}
          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-dark/70 text-primary-foreground px-4 py-2 rounded-full text-sm backdrop-blur-sm"
            >
              ← Glissez pour voir →
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSlider;

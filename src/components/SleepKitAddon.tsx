import { Minus, Plus, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { SLEEP_KIT_PRICE_CAD, type SleepKitVariant } from "@/hooks/useSleepKit";

interface Props {
  variant: SleepKitVariant;
  value: number;
  max: number;
  onChange: (n: number) => void;
}

const SleepKitAddon = ({ variant, value, max, onChange }: Props) => {
  const { t } = useLanguage();
  const { formatPrice } = useMarket();
  const subtotal = value * SLEEP_KIT_PRICE_CAD;
  const atMax = value >= max;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-4 sm:p-5"
      data-clarity-unmask="true"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Visual */}
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-dark-blue/90 flex items-center justify-center">
          {variant.imageUrl ? (
            <img
              src={variant.imageUrl}
              alt={t("sleepKit.name")}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <Moon size={28} className="text-gold" />
          )}
        </div>

        {/* Copy + stepper */}
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-foreground leading-tight">
            {t("sleepKit.title")}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            {t("sleepKit.subtitle")}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-full border border-border bg-background">
              <button
                type="button"
                onClick={() => onChange(Math.max(0, value - 1))}
                disabled={value <= 0}
                aria-label={t("sleepKit.remove")}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-l-full disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <Minus size={14} />
              </button>
              <span
                className="w-8 sm:w-9 text-center text-sm font-bold tabular-nums"
                data-clarity-unmask="true"
              >
                {value}
              </span>
              <button
                type="button"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={atMax}
                aria-label={t("sleepKit.add")}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-r-full disabled:opacity-30 hover:bg-muted transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            <span
              className="text-sm sm:text-base font-bold text-foreground tabular-nums"
              data-clarity-unmask="true"
            >
              + {formatPrice(subtotal)}
            </span>
          </div>

          <AnimatePresence>
            {atMax && value > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[11px] sm:text-xs text-gold font-semibold mt-2"
              >
                ✨ {t("sleepKit.maxReached")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default SleepKitAddon;
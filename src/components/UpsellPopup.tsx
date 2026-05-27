import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Clock, Flame } from "lucide-react";
import sleepMask from "@/assets/sleep-mask.png";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";

interface UpsellPopupProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const UpsellPopup = ({ open, onClose, onAccept }: UpsellPopupProps) => {
  const { t } = useLanguage();
  const { country, formatPrice } = useMarket();

  // Headband upsell pricing per market (kept consistent with site -50% logic)
  const headbandPriceMap: Record<typeof country, { now: number; old: number }> = {
    CA: { now: 19.90, old: 39.90 },
    US: { now: 19.90, old: 39.90 },
    FR: { now: 16.90, old: 33.90 },
  };
  const { now: headbandNow, old: headbandOld } = headbandPriceMap[country];

  const tipParts = t("upsell.tip").split(/<bold>|<\/bold>/);
  const benefits = [
    t("upsell.benefit1"),
    t("upsell.benefit2"),
    t("upsell.benefit3"),
    t("upsell.benefit4"),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div data-clarity-unmask="true" className="w-full max-w-md">
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
              <div className="bg-gradient-to-r from-gold to-gold-dark text-primary-foreground text-center py-3 px-4">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">{t("upsell.limitedOffer")}</span>
                </div>
                <p className="text-sm font-bold">
                  {t("upsell.banner")}
                </p>
              </div>

              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/40 transition-colors text-primary-foreground z-10"
              >
                <X size={16} />
              </button>

              <div className="p-5 space-y-4">
                <div className="bg-muted/50 border border-border rounded-lg p-3 flex items-start gap-2">
                  <span className="text-gold mt-0.5">💡</span>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{tipParts[1]}</strong>{tipParts[2]}
                  </p>
                </div>

                <div className="border border-border rounded-xl p-4 bg-background">
                  <div className="flex items-center gap-1 mb-3">
                    <span className="bg-destructive text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
                      {t("upsell.today")}
                    </span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 bg-muted/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <img src={sleepMask} alt="Sleep Headband MP3" className="w-20 h-20 object-contain" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{t("upsell.productName")}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-gold">{formatPrice(headbandNow, { showCode: false })}</span>
                        <span className="text-sm text-muted-foreground line-through">{formatPrice(headbandOld)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Flame size={12} className="text-destructive" />
                        <span className="text-xs text-destructive font-semibold">{t("upsell.onlyLeft")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">🎧 Bluetooth 5.0</span>
                    <span className="flex items-center gap-1">🔋 10h battery</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onAccept}
                  className="w-full bg-black text-primary-foreground py-3.5 rounded-xl text-sm font-bold shadow-[0_4px_20px_rgba(0,0,0,0.3)] uppercase tracking-wider"
                >
                  {t("upsell.cta")}
                </motion.button>

                <button
                  onClick={onClose}
                  className="w-full text-center text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  {t("upsell.decline")}
                </button>

                <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  {t("upsell.exclusive")}
                </p>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpsellPopup;

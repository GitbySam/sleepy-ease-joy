import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Copy, Check, AlertTriangle } from "lucide-react";
import { detectInAppBrowser, isIOS, isAndroid, openExternally, type InAppBrowser } from "@/lib/inAppBrowser";
import { useLanguage } from "@/i18n/LanguageContext";

const DISMISS_KEY = "sleepzy-iab-dismissed";

const COPY: Record<string, { title: string; subtitle: string; cta: string; copied: string; dismiss: string; iosHelp: string; androidHelp: string }> = {
  en: {
    title: "For the best experience, open in your browser",
    subtitle: "Checkout works better outside of the in-app browser.",
    cta: "Open in browser",
    copied: "Link copied — paste it in Safari",
    dismiss: "Dismiss",
    iosHelp: "Tap the ⋯ menu (top right) → \"Open in Safari\".",
    androidHelp: "Tap the ⋮ menu → \"Open in external browser\".",
  },
  fr: {
    title: "Pour une meilleure expérience, ouvre dans ton navigateur",
    subtitle: "Le paiement fonctionne mieux en dehors du navigateur intégré.",
    cta: "Ouvrir dans le navigateur",
    copied: "Lien copié — colle-le dans Safari",
    dismiss: "Fermer",
    iosHelp: "Appuie sur ⋯ (en haut à droite) → « Ouvrir dans Safari ».",
    androidHelp: "Appuie sur ⋮ → « Ouvrir dans le navigateur externe ».",
  },
  es: {
    title: "Para una mejor experiencia, abre en tu navegador",
    subtitle: "El pago funciona mejor fuera del navegador integrado.",
    cta: "Abrir en navegador",
    copied: "Enlace copiado — pégalo en Safari",
    dismiss: "Cerrar",
    iosHelp: "Toca ⋯ (arriba a la derecha) → « Abrir en Safari ».",
    androidHelp: "Toca ⋮ → « Abrir en navegador externo ».",
  },
};

const BROWSER_LABEL: Record<NonNullable<InAppBrowser>, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  messenger: "Messenger",
  tiktok: "TikTok",
  snapchat: "Snapchat",
  linkedin: "LinkedIn",
  line: "Line",
  pinterest: "Pinterest",
};

export default function InAppBrowserBanner() {
  const { lang } = useLanguage();
  const t = COPY[lang] || COPY.en;
  const [browser, setBrowser] = useState<InAppBrowser>(null);
  const [dismissed, setDismissed] = useState(true);
  const [feedback, setFeedback] = useState<"copied" | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const detected = detectInAppBrowser();
    if (!detected) return;
    let isDismissed = false;
    try {
      isDismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    setBrowser(detected);
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const handleOpen = async () => {
    const url = window.location.href;
    const result = await openExternally(url);
    if (result === "copied") {
      setFeedback("copied");
      setShowHelp(true);
    } else if (result === "failed") {
      setShowHelp(true);
    }
  };

  if (!browser || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="fixed top-0 inset-x-0 z-[100] bg-dark-blue text-cream shadow-xl border-b-2 border-gold"
        role="alert"
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-gold" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {t.title}
            </p>
            <p className="text-xs text-cream/80 mt-0.5">
              {BROWSER_LABEL[browser]} · {t.subtitle}
            </p>
            {showHelp && (
              <p className="text-xs text-gold mt-2 leading-snug">
                {isIOS() ? t.iosHelp : isAndroid() ? t.androidHelp : t.iosHelp}
              </p>
            )}
            {feedback === "copied" && (
              <p className="text-xs text-cream mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> {t.copied}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleOpen}
                className="inline-flex items-center gap-1.5 bg-gold text-dark-blue px-3 py-1.5 rounded-md text-xs font-bold hover:bg-gold/90 transition-colors"
              >
                {isIOS() ? <Copy className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                {t.cta}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label={t.dismiss}
            className="flex-shrink-0 text-cream/60 hover:text-cream transition-colors -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
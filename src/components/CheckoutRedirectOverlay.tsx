import { useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useLanguage } from "@/i18n/LanguageContext";

const MESSAGES: Record<string, { title: string; sub: string }> = {
  en: {
    title: "Redirecting to secure checkout…",
    sub: "You are being redirected to our secure checkout page powered by Shopify, the world leader in e-commerce.",
  },
  fr: {
    title: "Redirection vers le paiement sécurisé…",
    sub: "Vous êtes redirigé vers notre page de paiement sécurisée propulsée par Shopify, leader mondial du e-commerce.",
  },
  es: {
    title: "Redirigiendo al pago seguro…",
    sub: "Estás siendo redirigido a nuestra página de pago segura impulsada por Shopify, líder mundial del e-commerce.",
  },
};

const CheckoutRedirectOverlay = () => {
  const isRedirecting = useCartStore((s) => s.isRedirecting);
  const setRedirecting = useCartStore((s) => s.setRedirecting);
  const { language } = useLanguage() as { language?: string };
  const lang = (language && MESSAGES[language]) ? language : "en";
  const { title, sub } = MESSAGES[lang];

  // Failsafe: auto-hide after 12s in case the user returns to the tab
  useEffect(() => {
    if (!isRedirecting) return;
    const t = setTimeout(() => setRedirecting(false), 12000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") setRedirecting(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isRedirecting, setRedirecting]);

  if (!isRedirecting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-dark/90 backdrop-blur-md px-6"
    >
      <div className="max-w-sm w-full text-center text-cream">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 ring-1 ring-gold/40">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
        <h2 className="font-serif text-2xl font-semibold mb-3">{title}</h2>
        <p className="text-sm text-cream/80 leading-relaxed">{sub}</p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs text-cream/70">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>SSL · 3D Secure · 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutRedirectOverlay;

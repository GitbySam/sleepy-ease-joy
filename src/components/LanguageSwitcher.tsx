import { useLanguage } from "@/i18n/LanguageContext";
import type { Lang } from "@/i18n/translations";

const flags: Record<Lang, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  es: "🇪🇸",
};

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      {(Object.keys(flags) as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`text-lg leading-none p-1 rounded transition-all ${
            lang === l
              ? "bg-gold/20 scale-110"
              : "opacity-50 hover:opacity-80 hover:bg-muted"
          }`}
          aria-label={`Switch to ${l}`}
        >
          {flags[l]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;

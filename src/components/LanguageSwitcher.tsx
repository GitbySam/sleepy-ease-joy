import { useLanguage } from "@/i18n/LanguageContext";
import type { Lang } from "@/i18n/translations";
import FlagIcon from "@/components/FlagIcon";

const flagCode: Record<Lang, "US" | "FR" | "ES"> = {
  en: "US",
  fr: "FR",
  es: "ES",
};

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1">
      {(Object.keys(flagCode) as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`leading-none p-1 rounded transition-all ${
            lang === l
              ? "bg-gold/20 scale-110"
              : "opacity-50 hover:opacity-80 hover:bg-muted"
          }`}
          aria-label={`Switch to ${l}`}
        >
          <FlagIcon code={flagCode[l]} className="w-5 h-3.5 rounded-[1px] shadow-sm" />
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "./translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function detectLanguage(): Lang {
  const saved = localStorage.getItem("sleepzy-lang") as Lang;
  if (saved && ["en", "fr", "es"].includes(saved)) return saved;
  return "en";
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(detectLanguage);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("sleepzy-lang", newLang);
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, []);

  // Sync with IP-based detection from MarketContext (fires once per session)
  useEffect(() => {
    const onDetected = () => {
      const saved = localStorage.getItem("sleepzy-lang") as Lang;
      if (saved && ["en", "fr", "es"].includes(saved)) {
        setLangState(saved);
        document.documentElement.lang = saved;
      }
    };
    window.addEventListener("sleepzy:lang-detected", onDetected);
    return () => window.removeEventListener("sleepzy:lang-detected", onDetected);
  }, []);

  const t = (key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.en;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const fallback: LanguageContextType = {
  lang: "en",
  setLang: () => {},
  t: (key: TranslationKey) => {
    const entry = translations[key];
    return entry ? entry.en : key;
  },
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  return ctx ?? fallback;
};

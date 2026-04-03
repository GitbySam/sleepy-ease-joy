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

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

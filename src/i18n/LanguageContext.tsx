import { createContext, useContext, ReactNode } from "react";
import { translations, type TranslationKey } from "./translations";

interface LanguageContextType {
  lang: "en";
  setLang: (lang: "en") => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const t = (key: TranslationKey): string => {
    const entry = translations[key as string];
    if (!entry) return key as string;
    return entry.en;
  };

  return (
    <LanguageContext.Provider value={{ lang: "en", setLang: () => {}, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

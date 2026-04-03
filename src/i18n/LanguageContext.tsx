import { createContext, useContext, ReactNode } from "react";
import { translations, type TranslationKey } from "./translations";

interface LanguageContextType {
  lang: "en";
  setLang: (lang: "en") => void;
  t: (key: TranslationKey) => string;
}

const translate = (key: TranslationKey): string => {
  const entry = translations[key as string];
  if (!entry) return key as string;
  return entry.en;
};

const defaultLanguageContext: LanguageContextType = {
  lang: "en",
  setLang: () => {},
  t: translate,
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  return (
    <LanguageContext.Provider value={defaultLanguageContext}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

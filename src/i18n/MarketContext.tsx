import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

export type Country = "CA" | "US" | "FR";
export type Currency = "CAD" | "USD" | "EUR";

export interface MarketPrices {
  single: number;
  duo: number;
  family: number;
  oldSingle: number;
  oldDuo: number;
  oldFamily: number;
}

export interface MarketConfig {
  country: Country;
  currency: Currency;
  /** Currency symbol shown next to the amount */
  symbol: string;
  /** Trailing currency code shown after the amount (e.g. "CAD"), empty for EUR */
  code: string;
  /** Whether the symbol is placed before the amount (true) or after (false) */
  symbolBefore: boolean;
  /** Locale used for number formatting */
  locale: string;
  prices: MarketPrices;
}

export const MARKETS: Record<Country, MarketConfig> = {
  CA: {
    country: "CA",
    currency: "CAD",
    symbol: "$",
    code: "CAD",
    symbolBefore: true,
    locale: "en-CA",
    prices: {
      single: 34.95,
      duo: 69.90,
      family: 75.95,
      oldSingle: 69.90,
      oldDuo: 139.80,
      oldFamily: 209.70,
    },
  },
  US: {
    country: "US",
    currency: "USD",
    symbol: "$",
    code: "USD",
    symbolBefore: true,
    locale: "en-US",
    prices: {
      single: 29.95,
      duo: 59.90,
      family: 64.95,
      oldSingle: 59.90,
      oldDuo: 119.80,
      oldFamily: 179.95,
    },
  },
  FR: {
    country: "FR",
    currency: "EUR",
    symbol: "€",
    code: "",
    symbolBefore: false,
    locale: "fr-FR",
    prices: {
      single: 25.95,
      duo: 51.90,
      family: 56.95,
      oldSingle: 51.90,
      oldDuo: 103.80,
      oldFamily: 155.95,
    },
  },
};

interface MarketContextValue extends MarketConfig {
  setCountry: (c: Country) => void;
  /** Format a price amount using the active market's rules */
  formatPrice: (amount: number, opts?: { showCode?: boolean }) => string;
}

const MarketContext = createContext<MarketContextValue | null>(null);

const STORAGE_KEY = "sleepzy-market";

function readStoredCountry(): Country | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && (v === "CA" || v === "US" || v === "FR")) return v;
  } catch {}
  return null;
}

function detectCountryFromLang(): Country {
  try {
    const lang = localStorage.getItem("sleepzy-lang");
    if (lang === "fr") return "FR";
  } catch {}
  return "CA";
}

function formatAmount(amount: number, market: MarketConfig, showCode: boolean): string {
  // 2 decimals, locale-aware separators
  const formatted = new Intl.NumberFormat(market.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  let withSymbol = market.symbolBefore
    ? `${market.symbol}${formatted}`
    : `${formatted} ${market.symbol}`;

  if (showCode && market.code) {
    withSymbol = `${withSymbol} ${market.code}`;
  }
  return withSymbol;
}

export const MarketProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState<Country>(() => readStoredCountry() ?? detectCountryFromLang());
  const detectionRan = useRef(false);

  // Auto-detect country via IP on first load (only when no stored choice)
  useEffect(() => {
    if (detectionRan.current) return;
    detectionRan.current = true;
    if (readStoredCountry()) return; // user has already picked or system has decided once

    const ctrl = new AbortController();
    fetch("https://ipapi.co/country/", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.text() : null))
      .then((code) => {
        if (!code) return;
        const c = code.trim().toUpperCase();
        if (c === "CA" || c === "US" || c === "FR") {
          // Only update if user hasn't manually changed in the meantime
          if (!readStoredCountry()) {
            setCountryState(c as Country);
            try { localStorage.setItem(STORAGE_KEY, c); } catch {}
            // Auto-switch language for France visitors (only if user hasn't picked one)
            try {
              const savedLang = localStorage.getItem("sleepzy-lang");
              if (!savedLang) {
                const newLang = c === "FR" ? "fr" : "en";
                localStorage.setItem("sleepzy-lang", newLang);
                document.documentElement.lang = newLang;
                window.dispatchEvent(new Event("sleepzy:lang-detected"));
              }
            } catch {}
          }
        } else {
          // Unknown geo: keep CA as default but persist nothing so we can re-detect later
        }
      })
      .catch(() => { /* silent fallback */ });

    return () => ctrl.abort();
  }, []);

  const setCountry = (c: Country) => {
    setCountryState(c);
    try { localStorage.setItem(STORAGE_KEY, c); } catch {}
    // Reset any existing Shopify cart so checkout currency matches the new market.
    try {
      const raw = localStorage.getItem("shopify-cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        const prev = parsed?.state?.cartCountry;
        if (prev && prev !== c) {
          localStorage.removeItem("shopify-cart");
          // Force any open store instance to reload from cleared storage
          if (typeof window !== "undefined") window.dispatchEvent(new Event("sleepzy:cart-reset"));
        }
      }
    } catch {}
  };

  const market = MARKETS[country];
  const value: MarketContextValue = {
    ...market,
    setCountry,
    formatPrice: (amount, opts) => formatAmount(amount, market, opts?.showCode ?? true),
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
};

const fallbackMarket = MARKETS.CA;
const fallback: MarketContextValue = {
  ...fallbackMarket,
  setCountry: () => {},
  formatPrice: (amount, opts) => formatAmount(amount, fallbackMarket, opts?.showCode ?? true),
};

export const useMarket = () => {
  const ctx = useContext(MarketContext);
  return ctx ?? fallback;
};
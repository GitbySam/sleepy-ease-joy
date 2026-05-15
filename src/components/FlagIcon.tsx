import type { Country } from "@/i18n/MarketContext";

type Props = { code: Country | "ES"; className?: string };

/**
 * Inline SVG flags. Emoji flags don't render on Windows (Chrome/Brave/Edge)
 * because Windows ships no color font for regional indicator pairs.
 */
const FlagIcon = ({ code, className = "w-4 h-3" }: Props) => {
  switch (code) {
    case "CA":
      return (
        <svg viewBox="0 0 9 6" className={className} aria-hidden="true">
          <rect width="9" height="6" fill="#fff" />
          <rect width="2.25" height="6" fill="#d52b1e" />
          <rect x="6.75" width="2.25" height="6" fill="#d52b1e" />
          <path
            d="M4.5 1.4l.25.55.6-.15-.3.55.4.3-.55.1.05.55-.45-.3-.45.3.05-.55-.55-.1.4-.3-.3-.55.6.15z"
            fill="#d52b1e"
          />
        </svg>
      );
    case "US":
      return (
        <svg viewBox="0 0 19 10" className={className} aria-hidden="true">
          <rect width="19" height="10" fill="#b22234" />
          {[1, 3, 5, 7, 9].map((y) => (
            <rect key={y} y={y} width="19" height="1" fill="#fff" />
          ))}
          <rect width="8" height="5" fill="#3c3b6e" />
        </svg>
      );
    case "FR":
      return (
        <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
          <rect width="1" height="2" fill="#0055a4" />
          <rect x="1" width="1" height="2" fill="#fff" />
          <rect x="2" width="1" height="2" fill="#ef4135" />
        </svg>
      );
    case "ES":
      return (
        <svg viewBox="0 0 3 2" className={className} aria-hidden="true">
          <rect width="3" height="2" fill="#aa151b" />
          <rect y="0.5" width="3" height="1" fill="#f1bf00" />
        </svg>
      );
  }
};

export default FlagIcon;
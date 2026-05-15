import { Globe, Check } from "lucide-react";
import FlagIcon from "@/components/FlagIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMarket, type Country } from "@/i18n/MarketContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

const OPTIONS: { code: Country; label: string }[] = [
  { code: "CA", label: "Canada" },
  { code: "US", label: "United States" },
  { code: "FR", label: "France" },
];

const CountrySelector = ({ compact = false }: { compact?: boolean }) => {
  const { country, setCountry } = useMarket();
  const { setLang } = useLanguage();
  const cartId = useCartStore((s) => s.cartId);
  const clearCart = useCartStore((s) => s.clearCart);

  const current = OPTIONS.find((o) => o.code === country)!;

  const handleSelect = (c: Country) => {
    if (c === country) return;
    if (cartId) {
      clearCart();
      toast.info("Currency updated — cart reset");
    }
    setCountry(c);
    // Suggest matching language (user can override later)
    if (c === "FR") setLang("fr");
    else setLang("en");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Select country"
          className={`flex items-center gap-1.5 rounded-full border border-border bg-card/60 hover:bg-card transition-colors ${
            compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs"
          } font-sans-body text-foreground`}
        >
          <FlagIcon code={current.code} className="w-4 h-3 rounded-[1px] shadow-sm" />
          <span className="font-semibold tracking-wide">{current.code}</span>
          <Globe size={12} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.code}
            onClick={() => handleSelect(o.code)}
            className="cursor-pointer flex items-center gap-2"
          >
            <FlagIcon code={o.code} className="w-5 h-3.5 rounded-[1px] shadow-sm" />
            <span className="flex-1">{o.label}</span>
            {o.code === country && <Check size={14} className="text-gold" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CountrySelector;
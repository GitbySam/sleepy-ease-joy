import { useLanguage } from "@/i18n/LanguageContext";
import { TrendingUp } from "lucide-react";

const SocialProofToasts = () => {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-background border-y border-border/40 py-2.5">
      <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-sm font-sans-body text-muted-foreground">
        <TrendingUp className="w-4 h-4 text-success shrink-0" />
        <span className="font-semibold text-foreground">1,247</span>
        <span>{t("social.monthlySold")}</span>
      </div>
    </div>
  );
};

export default SocialProofToasts;

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const messageKeys: { emoji: string; name: string; city: string; lineKey: TranslationKey }[] = [
  { emoji: "😴", name: "Sarah L.", city: "Toronto", lineKey: "social.lines.1" },
  { emoji: "🫣", name: "Marc-André D.", city: "Montréal", lineKey: "social.lines.2" },
  { emoji: "✈️", name: "Emily M.", city: "Vancouver", lineKey: "social.lines.3" },
  { emoji: "😮‍💨", name: "Jake B.", city: "Calgary", lineKey: "social.lines.4" },
  { emoji: "📸", name: "Isabelle R.", city: "Ottawa", lineKey: "social.lines.5" },
  { emoji: "🙈", name: "Chris P.", city: "Edmonton", lineKey: "social.lines.6" },
  { emoji: "😤", name: "Amélie F.", city: "Québec City", lineKey: "social.lines.7" },
  { emoji: "💤", name: "David G.", city: "Winnipeg", lineKey: "social.lines.8" },
  { emoji: "🫡", name: "Sophie V.", city: "Halifax", lineKey: "social.lines.9" },
  { emoji: "😎", name: "Ryan C.", city: "Mississauga", lineKey: "social.lines.10" },
  { emoji: "🛡️", name: "Lauren H.", city: "Victoria", lineKey: "social.lines.11" },
  { emoji: "✅", name: "Jean-Philippe W.", city: "Laval", lineKey: "social.lines.12" },
];

const SocialProofToasts = () => {
  const indexRef = useRef(0);
  const { t } = useLanguage();

  useEffect(() => {
    const showToast = () => {
      const msg = messageKeys[Math.floor(Math.random() * messageKeys.length)];
      const minutes = Math.floor(Math.random() * 15) + 1;
      const timeAgo = `${minutes} ${t("social.minAgo")}`;
      const line = t(msg.lineKey);
      toast(
        `${msg.emoji} ${msg.name} ${t("social.from")} ${msg.city} — ${line}`,
        {
          description: timeAgo,
          duration: 4000,
          position: "bottom-left",
        }
      );
      indexRef.current++;
    };

    const initialTimeout = setTimeout(showToast, 5000);
    const interval = setInterval(showToast, 12000 + Math.random() * 8000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [t]);

  return null;
};

export default SocialProofToasts;

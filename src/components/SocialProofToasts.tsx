import { useEffect, useRef } from "react";
import { toast } from "sonner";

const messages = [
  { emoji: "😴", name: "Sarah L.", city: "NYC", line: "just saved her dignity" },
  { emoji: "🫣", name: "James D.", city: "LA", line: "no more drool photos" },
  { emoji: "✈️", name: "Emily M.", city: "Chicago", line: "never embarrassed again" },
  { emoji: "😮‍💨", name: "Mike B.", city: "Houston", line: "no more head-on-stranger moments" },
  { emoji: "📸", name: "Jessica R.", city: "Phoenix", line: "deleted the evidence, got Sleep&zy" },
  { emoji: "🙈", name: "Chris P.", city: "Philadelphia", line: "mouth officially stays closed" },
  { emoji: "😤", name: "Ashley F.", city: "San Antonio", line: "saved a friend from embarrassment too" },
  { emoji: "💤", name: "David G.", city: "San Diego", line: "sleeps with dignity now" },
  { emoji: "🫡", name: "Amanda V.", city: "Dallas", line: "no more viral Slack photos" },
  { emoji: "😎", name: "Ryan C.", city: "Austin", line: "reputation officially protected" },
  { emoji: "🛡️", name: "Lauren H.", city: "Denver", line: "anti-embarrassment kit secured" },
  { emoji: "✅", name: "Brandon W.", city: "Seattle", line: "no more drooling in public" },
];

function getRandomMessage() {
  return messages[Math.floor(Math.random() * messages.length)];
}

function getTimeAgo() {
  const minutes = Math.floor(Math.random() * 15) + 1;
  return `${minutes} min ago`;
}

const SocialProofToasts = () => {
  const indexRef = useRef(0);

  useEffect(() => {
    const showToast = () => {
      const msg = getRandomMessage();
      const time = getTimeAgo();
      toast(
        `${msg.emoji} ${msg.name} from ${msg.city} — ${msg.line}`,
        {
          description: time,
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
  }, []);

  return null;
};

export default SocialProofToasts;

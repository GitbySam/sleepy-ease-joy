import { useEffect, useRef } from "react";
import { toast } from "sonner";

const buyers = [
  { name: "Marie L.", city: "Paris", qty: 2 },
  { name: "Thomas D.", city: "Lyon", qty: 1 },
  { name: "Sophie M.", city: "Bordeaux", qty: 3 },
  { name: "Lucas B.", city: "Marseille", qty: 1 },
  { name: "Camille R.", city: "Toulouse", qty: 2 },
  { name: "Antoine P.", city: "Nantes", qty: 1 },
  { name: "Julie F.", city: "Lille", qty: 2 },
  { name: "Nicolas G.", city: "Strasbourg", qty: 1 },
  { name: "Emma V.", city: "Rennes", qty: 3 },
  { name: "Hugo C.", city: "Nice", qty: 1 },
  { name: "Léa H.", city: "Montpellier", qty: 2 },
  { name: "Maxime W.", city: "Grenoble", qty: 1 },
];

function getRandomBuyer() {
  return buyers[Math.floor(Math.random() * buyers.length)];
}

function getTimeAgo() {
  const minutes = Math.floor(Math.random() * 15) + 1;
  return `il y a ${minutes} min`;
}

const SocialProofToasts = () => {
  const indexRef = useRef(0);

  useEffect(() => {
    const showToast = () => {
      const buyer = getRandomBuyer();
      const time = getTimeAgo();
      toast(
        `🛒 ${buyer.name} de ${buyer.city} a acheté ${buyer.qty > 1 ? `${buyer.qty} Sleepenzy` : "1 Sleepenzy"}`,
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

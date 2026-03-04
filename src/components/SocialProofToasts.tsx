import { useEffect, useRef } from "react";
import { toast } from "sonner";

const buyers = [
  { name: "Sarah L.", city: "New York", qty: 2 },
  { name: "James D.", city: "Los Angeles", qty: 1 },
  { name: "Emily M.", city: "Chicago", qty: 3 },
  { name: "Mike B.", city: "Houston", qty: 1 },
  { name: "Jessica R.", city: "Phoenix", qty: 2 },
  { name: "Chris P.", city: "Philadelphia", qty: 1 },
  { name: "Ashley F.", city: "San Antonio", qty: 2 },
  { name: "David G.", city: "San Diego", qty: 1 },
  { name: "Amanda V.", city: "Dallas", qty: 3 },
  { name: "Ryan C.", city: "Austin", qty: 1 },
  { name: "Lauren H.", city: "Denver", qty: 2 },
  { name: "Brandon W.", city: "Seattle", qty: 1 },
];

function getRandomBuyer() {
  return buyers[Math.floor(Math.random() * buyers.length)];
}

function getTimeAgo() {
  const minutes = Math.floor(Math.random() * 15) + 1;
  return `${minutes} min ago`;
}

const SocialProofToasts = () => {
  const indexRef = useRef(0);

  useEffect(() => {
    const showToast = () => {
      const buyer = getRandomBuyer();
      const time = getTimeAgo();
      toast(
        `🛒 ${buyer.name} from ${buyer.city} bought ${buyer.qty > 1 ? `${buyer.qty} Sleep&zy` : "1 Sleep&zy"}`,
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

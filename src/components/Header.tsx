import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import ShopifyCartDrawer from "./ShopifyCartDrawer";

const AnnouncementBar = () => (
  <div className="bg-dark text-primary-foreground py-2 overflow-hidden">
    <div className="animate-marquee whitespace-nowrap flex">
      {[...Array(2)].map((_, i) => (
        <span key={i} className="mx-8 text-sm font-sans-body tracking-wider">
          Limited Offer -50% &nbsp;•&nbsp; Free Shipping &nbsp;•&nbsp; Secure Payment &nbsp;•&nbsp;
          Limited Offer -50% &nbsp;•&nbsp; Free Shipping &nbsp;•&nbsp; Secure Payment &nbsp;•&nbsp;
          Limited Offer -50% &nbsp;•&nbsp; Free Shipping &nbsp;•&nbsp; Secure Payment &nbsp;•&nbsp;
        </span>
      ))}
    </div>
  </div>
);

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <AnnouncementBar />
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-card/80 backdrop-blur-md shadow-sm"
            : "bg-card/50 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <a href="#" className="font-serif text-2xl font-bold text-foreground tracking-tight">
            Sleep<span className="text-gold">&zy</span>
          </a>
          <div className="hidden md:flex items-center gap-8 font-sans-body text-sm text-muted-foreground">
            <a href="#benefits" className="hover:text-foreground transition-colors">Benefits</a>
            <a href="#proof" className="hover:text-foreground transition-colors">Results</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/product">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gold text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-gold-glow"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Shop Now</span>
              </motion.span>
            </Link>
            <ShopifyCartDrawer />
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

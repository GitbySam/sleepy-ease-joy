import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import ShopifyCartDrawer from "./ShopifyCartDrawer";

import { useLanguage } from "@/i18n/LanguageContext";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const marqueeText = `${t("header.marquee")} \u00a0•\u00a0 `;

  const navLinks = [
    { to: "/product", label: t("nav.products"), isLink: true },
    { to: "/#benefits", label: t("nav.benefits"), isLink: false },
    { to: "/#results", label: t("nav.results"), isLink: false },
    { to: "/#testimonials", label: t("nav.reviews"), isLink: false },
    { to: "/#faq", label: t("nav.faq"), isLink: false },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-dark text-primary-foreground py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="mx-8 text-sm font-sans-body tracking-wider">
              {marqueeText}{marqueeText}{marqueeText}
            </span>
          ))}
        </div>
      </div>
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-card/80 backdrop-blur-md shadow-sm"
            : "bg-card/50 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link to="/" className="font-serif text-2xl font-bold text-foreground tracking-tight">
            Sleep<span className="text-gold">&zy</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8 font-sans-body text-sm text-muted-foreground">
            {navLinks.map((link) =>
              link.isLink ? (
                <Link key={link.to} to={link.to} className="hover:text-foreground transition-colors">{link.label}</Link>
              ) : (
                <a key={link.to} href={link.to} className="hover:text-foreground transition-colors">{link.label}</a>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/product" className="hidden md:block">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gold text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-gold-glow"
              >
                <ShoppingBag size={16} />
                <span>{t("nav.shopNow")}</span>
              </motion.span>
            </Link>
            <ShopifyCartDrawer />

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed inset-0 top-0 z-40 bg-card/98 backdrop-blur-xl flex flex-col pt-32"
          >
            <div className="flex flex-col items-center gap-6 py-8">
              {navLinks.map((link) =>
                link.isLink ? (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="text-xl font-serif font-semibold text-foreground hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.to}
                    href={link.to}
                    onClick={() => setMenuOpen(false)}
                    className="text-xl font-serif font-semibold text-foreground hover:text-gold transition-colors"
                  >
                    {link.label}
                  </a>
                )
              )}

              <Link to="/product" onClick={() => setMenuOpen(false)} className="mt-4">
                <motion.span
                  whileTap={{ scale: 0.95 }}
                  className="bg-gold text-primary-foreground px-8 py-3.5 rounded-full text-base font-bold shadow-gold-glow flex items-center gap-2 uppercase tracking-wider"
                >
                  <ShoppingBag size={18} />
                  {t("nav.shopNow")}
                </motion.span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

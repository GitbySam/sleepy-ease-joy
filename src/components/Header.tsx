import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
const ShopifyCartDrawer = lazy(() => import("./ShopifyCartDrawer"));
import { useLanguage } from "@/i18n/LanguageContext";
import CountrySelector from "./CountrySelector";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useMarket } from "@/i18n/MarketContext";
import { useCartStore } from "@/stores/cartStore";
import { trackAddToCart } from "@/lib/metaPixel";
import { toast } from "sonner";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();
  const location = useLocation();
  const { country, currency, prices } = useMarket();
  const { addItem, setDrawerOpen } = useCartStore();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);

  useEffect(() => {
    fetchProducts(20, undefined, country)
      .then((all) => {
        const filtered = all.filter((p) => {
          const s = `${p.node.title} ${p.node.handle}`.toLowerCase();
          return !/(kit|bundle)/.test(s);
        });
        setProduct(filtered[0] || null);
      })
      .catch(() => {});
  }, [country]);

  const handleHeaderAtc = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    if (!product) {
      toast.error("Product unavailable");
      return;
    }
    const greyVariants = product.node.variants.edges.filter((v) =>
      v.node.selectedOptions?.some((o) => o.name === "Color" && o.value === "Grey")
    );
    const variant =
      greyVariants.find((v) => v.node.selectedOptions?.some((o) => o.value === "Single"))?.node ||
      greyVariants[0]?.node ||
      product.node.variants.edges[0]?.node;
    if (!variant) {
      toast.error("Variant not available");
      return;
    }
    await addItem(
      {
        product,
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        selectedOptions: variant.selectedOptions || [],
        bundleLabel: "1 Sleep&zy",
        bundlePrice: prices.single,
        bundleUnitSize: 1,
      },
      country
    );
    trackAddToCart({
      contentName: `1 Sleep&zy (Grey)`,
      contentId: variant.id,
      value: prices.single,
      currency,
      quantity: 1,
    });
    toast.success(`1 Sleep&zy ${t("product.addedToCart")}`, { position: "top-center" });
    setTimeout(() => setDrawerOpen(true), 500);
  };

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
    { to: "/product", label: t("nav.products") },
    { to: "/#benefits", label: t("nav.benefits") },
    { to: "/#results", label: t("nav.results") },
    { to: "/#testimonials", label: t("nav.reviews") },
    { to: "/#faq", label: t("nav.faq") },
  ];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    to: string
  ) => {
    setMenuOpen(false);
    // If we're on the home page and the link is an anchor, smooth-scroll
    if (location.pathname === "/" && to.includes("#")) {
      const hash = to.split("#")[1];
      const el = document.getElementById(hash);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
    // Otherwise let <Link> handle normal SPA navigation
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-dark text-primary-foreground py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="mx-8 text-sm font-sans-body tracking-[0.08em]">
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
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavClick(e, link.to)}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* LanguageSwitcher hidden but system still active */}
            <CountrySelector />
            <motion.button
              onClick={handleHeaderAtc}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex bg-black text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            >
              <ShoppingBag size={16} />
              <span>{t("nav.shopNow")}</span>
            </motion.button>
            <Suspense fallback={null}><ShopifyCartDrawer /></Suspense>

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
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleNavClick(e, link.to)}
                  className="text-xl font-serif font-semibold text-foreground hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* LanguageSwitcher hidden but system still active */}

              <div className="mt-2"><CountrySelector /></div>

              <motion.button
                onClick={handleHeaderAtc}
                whileTap={{ scale: 0.95 }}
                className="mt-4 bg-black text-primary-foreground px-8 py-3.5 rounded-full text-base font-bold shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center gap-2 uppercase tracking-wider"
              >
                <ShoppingBag size={18} />
                {t("nav.shopNow")}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;

import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FooterAccordion = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden border-b border-dark-blue-foreground/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-sm font-semibold uppercase tracking-wider text-dark-blue-foreground/80"
      >
        {title}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-60 pb-4" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

const Footer = () => {
  const { t } = useLanguage();

  const navLinks = (
    <ul className="space-y-2 text-sm text-dark-blue-foreground/50">
      <li><a href="#benefits" className="hover:text-dark-blue-foreground transition-colors">{t("nav.benefits")}</a></li>
      <li><a href="#results" className="hover:text-dark-blue-foreground transition-colors">{t("nav.results")}</a></li>
      <li><a href="#testimonials" className="hover:text-dark-blue-foreground transition-colors">{t("nav.reviews")}</a></li>
      <li><a href="#faq" className="hover:text-dark-blue-foreground transition-colors">{t("nav.faq")}</a></li>
    </ul>
  );

  const legalLinks = (
    <ul className="space-y-2 text-sm text-dark-blue-foreground/50">
      <li><Link to="/terms" className="hover:text-dark-blue-foreground transition-colors">{t("footer.terms")}</Link></li>
      <li><Link to="/privacy" className="hover:text-dark-blue-foreground transition-colors">{t("footer.privacy")}</Link></li>
      <li><Link to="/returns" className="hover:text-dark-blue-foreground transition-colors">{t("footer.returns")}</Link></li>
      <li><Link to="/shipping" className="hover:text-dark-blue-foreground transition-colors">{t("footer.shipping")}</Link></li>
    </ul>
  );

  const contactInfo = (
    <ul className="space-y-2 text-sm text-dark-blue-foreground/50">
      <li>support@sleepenzy.com</li>
      <li>{t("footer.support247")}</li>
    </ul>
  );

  return (
    <footer className="bg-dark-blue text-dark-blue-foreground py-12 md:py-16">
      <div className="container mx-auto px-6">
        {/* Logo + description always visible */}
        <div className="mb-8 md:mb-0">
          <h3 className="font-serif text-2xl font-bold mb-3 text-dark-blue-foreground">
            Sleep<span className="text-gold">&zy</span>
          </h3>
          <p className="text-sm text-dark-blue-foreground/60 leading-relaxed max-w-xs">
            {t("footer.desc")}
          </p>
        </div>

        {/* Mobile: accordions */}
        <div className="md:hidden mt-6">
          <FooterAccordion title={t("footer.navigation")}>{navLinks}</FooterAccordion>
          <FooterAccordion title={t("footer.legal")}>{legalLinks}</FooterAccordion>
          <FooterAccordion title={t("footer.contact")}>{contactInfo}</FooterAccordion>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-10 -mt-16">
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4 text-dark-blue-foreground">
              Sleep<span className="text-gold">&zy</span>
            </h3>
            <p className="text-sm text-dark-blue-foreground/60 leading-relaxed">
              {t("footer.desc")}
            </p>
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-dark-blue-foreground/80">
              {t("footer.navigation")}
            </h4>
            {navLinks}
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-dark-blue-foreground/80">
              {t("footer.legal")}
            </h4>
            {legalLinks}
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-dark-blue-foreground/80">
              {t("footer.contact")}
            </h4>
            {contactInfo}
          </div>
        </div>

        <div className="border-t border-dark-blue-foreground/10 mt-8 md:mt-12 pt-6 md:pt-8 text-center text-xs text-dark-blue-foreground/40">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

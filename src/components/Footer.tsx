import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-dark-blue text-dark-blue-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
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
            <ul className="space-y-2 text-sm text-dark-blue-foreground/50">
              <li><a href="#benefits" className="hover:text-dark-blue-foreground transition-colors">{t("nav.benefits")}</a></li>
              <li><a href="#proof" className="hover:text-dark-blue-foreground transition-colors">{t("nav.results")}</a></li>
              <li><a href="#testimonials" className="hover:text-dark-blue-foreground transition-colors">{t("nav.reviews")}</a></li>
              <li><a href="#faq" className="hover:text-dark-blue-foreground transition-colors">{t("nav.faq")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-dark-blue-foreground/80">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2 text-sm text-dark-blue-foreground/50">
              <li><Link to="/terms" className="hover:text-dark-blue-foreground transition-colors">{t("footer.terms")}</Link></li>
              <li><Link to="/privacy" className="hover:text-dark-blue-foreground transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link to="/returns" className="hover:text-dark-blue-foreground transition-colors">{t("footer.returns")}</Link></li>
              <li><Link to="/shipping" className="hover:text-dark-blue-foreground transition-colors">{t("footer.shipping")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-dark-blue-foreground/80">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-2 text-sm text-dark-blue-foreground/50">
              <li>support@sleepenzy.com</li>
              <li>{t("footer.support247")}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-dark-blue-foreground/10 mt-12 pt-8 text-center text-xs text-dark-blue-foreground/40">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

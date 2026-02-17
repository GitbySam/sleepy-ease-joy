const Footer = () => (
  <footer className="bg-dark text-primary-foreground py-16">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-serif text-2xl font-bold mb-4">
            Sleep<span className="text-gold">enzy</span>
          </h3>
          <p className="text-sm text-primary-foreground/60 leading-relaxed">
            Le coussin cervical ergonomique qui révolutionne votre sommeil en voyage.
          </p>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
            Navigation
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/50">
            <li><a href="#benefits" className="hover:text-primary-foreground transition-colors">Bénéfices</a></li>
            <li><a href="#proof" className="hover:text-primary-foreground transition-colors">Résultats</a></li>
            <li><a href="#testimonials" className="hover:text-primary-foreground transition-colors">Avis clients</a></li>
            <li><a href="#faq" className="hover:text-primary-foreground transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
            Légal
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/50">
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Conditions générales</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Politique de confidentialité</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Retours & remboursements</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Livraison</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
            Contact
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/50">
            <li>contact@sleepenzy.com</li>
            <li>Support 7j/7</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-xs text-primary-foreground/40">
        © 2026 Sleepenzy. Tous droits réservés.
      </div>
    </div>
  </footer>
);

export default Footer;

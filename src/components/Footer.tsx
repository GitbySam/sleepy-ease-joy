import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-dark text-primary-foreground py-16">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-serif text-2xl font-bold mb-4">
            Sleep<span className="text-gold">&zy</span>
          </h3>
          <p className="text-sm text-primary-foreground/60 leading-relaxed">
            The ergonomic cervical pillow that revolutionizes your travel sleep.
          </p>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
            Navigation
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/50">
            <li><a href="#benefits" className="hover:text-primary-foreground transition-colors">Benefits</a></li>
            <li><a href="#proof" className="hover:text-primary-foreground transition-colors">Results</a></li>
            <li><a href="#testimonials" className="hover:text-primary-foreground transition-colors">Reviews</a></li>
            <li><a href="#faq" className="hover:text-primary-foreground transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
            Legal
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/50">
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Terms & Conditions</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Returns & Refunds</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Shipping</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold uppercase tracking-wider mb-4 text-primary-foreground/80">
            Contact
          </h4>
          <ul className="space-y-2 text-sm text-primary-foreground/50">
            <li>support@sleepenzy.com</li>
            <li>24/7 Support</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center text-xs text-primary-foreground/40">
        © 2026 Sleep&zy. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;

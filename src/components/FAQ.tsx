import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Comment fonctionne le coussin Sleepenzy ?",
    a: "Sleepenzy utilise un support structurel interne qui maintient votre mâchoire et votre menton, empêchant votre tête de basculer vers l'avant ou sur le côté. Cela élimine le réflexe vestibulaire de réveil qui vous réveille en sursaut.",
  },
  {
    q: "Est-ce différent d'un coussin en U classique ?",
    a: "Oui, fondamentalement. Les coussins en U ne font qu'amortir votre tête APRÈS qu'elle tombe. Sleepenzy empêche le mouvement AVANT qu'il ne se produise grâce à son support structurel 360°.",
  },
  {
    q: "Est-il confortable pour les longs vols ?",
    a: "Absolument. Sa mousse à mémoire de forme et son tissu respirant le rendent confortable même sur des vols de 12h+. Pas de sensation de compression ni de chaleur excessive.",
  },
  {
    q: "Peut-on le laver ?",
    a: "Oui, la housse est amovible et lavable en machine à 30°C. Le support interne se nettoie avec un chiffon humide.",
  },
  {
    q: "Quelle est la politique de retour ?",
    a: "Nous offrons une garantie satisfait ou remboursé de 90 jours. Si vous n'êtes pas 100% satisfait, renvoyez-le et nous vous remboursons intégralement, sans questions.",
  },
  {
    q: "Combien de temps dure la livraison ?",
    a: "La livraison standard gratuite prend 7-12 jours ouvrés en France métropolitaine. Une option express (3-5 jours) est disponible au moment du paiement.",
  },
];

const FAQ = () => (
  <section id="faq" className="py-24 gradient-section-warm">
    <div className="container mx-auto px-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Des questions ?
        </p>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
          Questions <span className="text-gold italic">fréquentes</span>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="bg-card border border-border rounded-xl px-6 overflow-hidden"
            >
              <AccordionTrigger className="text-left font-serif text-base font-semibold hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQ;

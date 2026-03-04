import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does the Sleep&zy pillow work?",
    a: "Sleep&zy uses an internal structural support that holds your jaw and chin in place, preventing your head from falling forward or to the side. This eliminates the vestibular wake reflex that jolts you awake.",
  },
  {
    q: "Is it different from a regular U-shaped pillow?",
    a: "Yes, fundamentally. U-shaped pillows only cushion your head AFTER it falls. Sleep&zy prevents the movement BEFORE it happens thanks to its 360° structural support.",
  },
  {
    q: "Is it comfortable for long flights?",
    a: "Absolutely. Its memory foam and breathable fabric make it comfortable even on 12+ hour flights. No compression feeling or excessive heat.",
  },
  {
    q: "Can I wash it?",
    a: "Yes, the cover is removable and machine-washable at 85°F. The internal support can be wiped clean with a damp cloth.",
  },
  {
    q: "What is the return policy?",
    a: "We offer a 90-day money-back guarantee. If you're not 100% satisfied, send it back and we'll give you a full refund, no questions asked.",
  },
  {
    q: "How long does shipping take?",
    a: "Free standard shipping takes 5-8 business days within the US. An express option (2-3 days) is available at checkout.",
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
          Got questions?
        </p>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
          Frequently Asked <span className="text-gold italic">Questions</span>
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

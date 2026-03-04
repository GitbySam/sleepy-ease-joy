import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Will it really stop me from drooling?",
    a: "Yes! Sleep&zy's chin support keeps your jaw gently closed, which prevents your mouth from falling open — the #1 cause of drooling while sleeping upright. No more waking up to a wet shirt.",
  },
  {
    q: "Does it prevent my mouth from opening?",
    a: "Absolutely. The structural support cradles your chin and jaw, keeping them in a natural closed position. You'll look composed and dignified even in deep sleep.",
  },
  {
    q: "Will people notice I'm wearing it?",
    a: "Nope. Sleep&zy looks like a stylish scarf or neck accessory. It's designed to be discreet — nobody will know it's a travel pillow until you tell them.",
  },
  {
    q: "What if I'm a heavy sleeper who moves a lot?",
    a: "That's exactly who this is for. The 360° structural support locks your head in place no matter how deeply you sleep. No more waking up on a stranger's shoulder.",
  },
  {
    q: "Can I wash it?",
    a: "Yes, the cover is removable and machine-washable at 85°F. The internal support can be wiped clean with a damp cloth.",
  },
  {
    q: "What is the return policy?",
    a: "We offer a 90-day dignity-back guarantee. If you're not 100% satisfied, send it back for a full refund, no questions asked.",
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

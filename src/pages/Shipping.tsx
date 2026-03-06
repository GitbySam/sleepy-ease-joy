import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Truck, Clock, RefreshCw } from "lucide-react";

const Shipping = () => (
  <>
    <Header />
    <main className="pt-32 pb-20 bg-background min-h-screen">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-2 text-foreground">Shipping Information</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 6, 2026</p>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On all orders" },
            { icon: Clock, title: "7-14 Business Days", desc: "Delivery time" },
            { icon: RefreshCw, title: "30-Day Returns", desc: "Money-back guarantee" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border">
              <Icon className="w-8 h-8 text-gold mb-3" />
              <h3 className="font-semibold text-foreground text-sm">{title}</h3>
              <p className="text-muted-foreground text-xs">{desc}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Processing Time</h2>
            <p>Orders are processed within 1-2 business days. You will receive a confirmation email with tracking information once your order has shipped.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Delivery Times</h2>
            <p>We ship worldwide! Estimated delivery times after processing:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>United States:</strong> 7-10 business days</li>
              <li><strong>Canada:</strong> 8-12 business days</li>
              <li><strong>Europe:</strong> 10-14 business days</li>
              <li><strong>Australia:</strong> 10-14 business days</li>
              <li><strong>Rest of World:</strong> 12-18 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Shipping Costs</h2>
            <p>We offer <strong>FREE standard shipping</strong> on all orders worldwide. Express shipping options are available at checkout for an additional fee.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Customs & Duties</h2>
            <p>For international orders, customs fees and import duties may apply depending on your country's regulations. These fees are the responsibility of the customer and are not included in our shipping costs.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Order Tracking</h2>
            <p>Once your order has shipped, you will receive a tracking number via email. You can use this number to track your package through our shipping partner's website.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Contact Us</h2>
            <p>For any shipping questions, please contact us at: <a href="mailto:support@sleepenzy.com" className="text-gold hover:underline">support@sleepenzy.com</a></p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default Shipping;

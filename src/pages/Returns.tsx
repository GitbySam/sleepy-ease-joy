import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Returns = () => (
  <>
    <Header />
    <main className="pt-32 pb-20 bg-background min-h-screen">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-2 text-foreground">Returns & Refunds</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 6, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">30-Day Money-Back Guarantee</h2>
            <p>We want you to be completely satisfied with your purchase. If you're not happy with your Sleep&zy product for any reason, you can return it within 30 days of delivery for a full refund.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Return Conditions</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Items must be unused and in their original packaging</li>
              <li>Return request must be made within 30 days of delivery</li>
              <li>Original proof of purchase is required</li>
              <li>Return shipping costs are the responsibility of the customer (unless item is defective)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">How to Initiate a Return</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Contact our support team at <a href="mailto:support@sleepenzy.com" className="text-gold hover:underline">support@sleepenzy.com</a> with your order number</li>
              <li>Our team will provide you with a return authorization and instructions</li>
              <li>Ship the item(s) back in their original packaging</li>
              <li>Once we receive and inspect the returned item(s), we will process your refund</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Refund Processing</h2>
            <p>Refunds are processed within 5-7 business days after we receive the returned item(s). The refund will be issued to the original payment method. Please note that your bank may take an additional 3-5 business days to reflect the refund in your account.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Damaged or Defective Items</h2>
            <p>If you receive a damaged or defective item, please contact us immediately at <a href="mailto:support@sleepenzy.com" className="text-gold hover:underline">support@sleepenzy.com</a> with photos of the damage. We will arrange a free replacement or full refund at no additional cost to you.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Exchanges</h2>
            <p>We currently do not offer direct exchanges. If you would like a different product, please initiate a return for the original item and place a new order.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">Contact Us</h2>
            <p>For any questions about returns or refunds, please contact us at: <a href="mailto:support@sleepenzy.com" className="text-gold hover:underline">support@sleepenzy.com</a></p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default Returns;

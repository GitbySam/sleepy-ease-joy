import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => (
  <>
    <Header />
    <main className="pt-32 pb-20 bg-background min-h-screen">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-2 text-foreground">Terms & Conditions</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 6, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing and placing an order with Sleep&zy, you confirm that you are in agreement with and bound by the terms of service contained in these Terms & Conditions. These terms apply to the entire website and any email or other type of communication between you and Sleep&zy.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">2. Products</h2>
            <p>Sleep&zy offers premium ergonomic cervical travel pillows and sleep accessories. All products are subject to availability. We reserve the right to discontinue any product at any time. Product images are for illustrative purposes; actual products may vary slightly.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">3. Pricing and Payment</h2>
            <p>All prices are displayed in USD and are subject to change without notice. We accept major credit cards, PayPal, and other payment methods as displayed at checkout. Payment must be received in full before order processing begins.</p>
            <p>We are not responsible for pricing errors. In case of a pricing error, we reserve the right to cancel your order and refund the full amount paid.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">4. Shipping</h2>
            <p>We ship internationally. Delivery times typically range from 7-14 business days depending on your location. Shipping costs and estimated delivery times are calculated at checkout. Sleep&zy is not responsible for delays caused by customs, weather, or carrier issues.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">5. Returns and Refunds</h2>
            <p>We offer a 30-day money-back guarantee on all products. If you are not satisfied with your purchase, you may return the item(s) for a full refund within 30 days of delivery. Products must be unused and in their original packaging. Please refer to our Returns & Refunds page for detailed instructions.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">6. Product Warranty</h2>
            <p>All Sleep&zy products come with a 1-year warranty against manufacturing defects. This warranty does not cover damage caused by misuse, normal wear and tear, or unauthorized modifications.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">7. Intellectual Property</h2>
            <p>All content on this website, including text, images, logos, and designs, is the property of Sleep&zy and is protected by intellectual property laws. You may not reproduce, distribute, or use any content without our written consent.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>Sleep&zy shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our products or website. Our total liability shall not exceed the amount you paid for your order.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">9. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on the website. Your continued use of the site constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">10. Contact Us</h2>
            <p>For questions about these Terms & Conditions, please contact us at: <a href="mailto:support@sleepenzy.com" className="text-gold hover:underline">support@sleepenzy.com</a></p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default Terms;

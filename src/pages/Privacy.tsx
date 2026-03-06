import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => (
  <>
    <Header />
    <main className="pt-32 pb-20 bg-background min-h-screen">
      <div className="container mx-auto px-6 max-w-3xl">
        <h1 className="font-serif text-4xl font-bold mb-2 text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: March 6, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>When you make a purchase or attempt to make a purchase through our site, we collect certain information from you, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name and contact information (email address, phone number)</li>
              <li>Billing and shipping address</li>
              <li>Payment information (processed securely)</li>
              <li>Order history and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your order status</li>
              <li>Provide customer support</li>
              <li>Send promotional emails (with your consent)</li>
              <li>Improve our products and services</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">3. Information Sharing</h2>
            <p>We share your personal information with third parties only to help us process orders, fulfill shipments, and provide our services. We never sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">4. Cookies</h2>
            <p>We use cookies to maintain your shopping cart, remember your preferences, and understand how you use our site. You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">5. Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. All payment transactions are encrypted using SSL technology. We do not store your credit card information on our servers.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-foreground">7. Contact Us</h2>
            <p>For questions about this Privacy Policy or your personal data, please contact us at: <a href="mailto:support@sleepenzy.com" className="text-gold hover:underline">support@sleepenzy.com</a></p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default Privacy;

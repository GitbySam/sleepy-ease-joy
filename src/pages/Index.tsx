import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import InAction from "@/components/InAction";
import Benefits from "@/components/Benefits";
import ComparisonSlider from "@/components/ComparisonSlider";
import Testimonials from "@/components/Testimonials";
import BundleOffer from "@/components/BundleOffer";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import SocialProofToasts from "@/components/SocialProofToasts";
import InactivityPopup from "@/components/InactivityPopup";
import ShopifyProducts from "@/components/ShopifyProducts";
import StickyMobileCTA from "@/components/StickyMobileCTA";

const Index = () => (
  <>
    <Header />
    <SocialProofToasts />
    <InactivityPopup />
    <main>
      <Hero />
      <ComparisonSlider />
      <Marquee />
      <InAction />
      <Benefits />
      <ShopifyProducts />
      <Testimonials />
      <BundleOffer />
      <FAQ />
    </main>
    <Footer />
  </>
);

export default Index;

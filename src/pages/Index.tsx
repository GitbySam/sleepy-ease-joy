import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Benefits from "@/components/Benefits";
import ComparisonSlider from "@/components/ComparisonSlider";
import Testimonials from "@/components/Testimonials";
import BundleOffer from "@/components/BundleOffer";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import SocialProofToasts from "@/components/SocialProofToasts";
import InactivityPopup from "@/components/InactivityPopup";

const Index = () => (
  <>
    <Header />
    <SocialProofToasts />
    <InactivityPopup />
    <main>
      <Hero />
      <Marquee />
      <Benefits />
      <ComparisonSlider />
      <Testimonials />
      <BundleOffer />
      <FAQ />
    </main>
    <Footer />
  </>
);

export default Index;

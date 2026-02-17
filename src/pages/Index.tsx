import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Benefits from "@/components/Benefits";
import ComparisonSlider from "@/components/ComparisonSlider";
import Testimonials from "@/components/Testimonials";
import BundleOffer from "@/components/BundleOffer";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => (
  <>
    <Header />
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

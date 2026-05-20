import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import ScrollToTop from "@/components/ScrollToTop";

const StickyMobileCTA = lazy(() => import("@/components/StickyMobileCTA"));

const ComparisonSlider = lazy(() => import("@/components/ComparisonSlider"));
const InAction = lazy(() => import("@/components/InAction"));
const ShopifyProducts = lazy(() => import("@/components/ShopifyProducts"));
const Benefits = lazy(() => import("@/components/Benefits"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const CtaBridge = lazy(() => import("@/components/CtaBridge"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Footer = lazy(() => import("@/components/Footer"));
const SocialProofToasts = lazy(() => import("@/components/SocialProofToasts"));
const InactivityPopup = lazy(() => import("@/components/InactivityPopup"));

const Placeholder = ({ height = "400px" }: { height?: string }) => (
  <div style={{ minHeight: height }} />
);

const Index = () => (
  <div data-clarity-unmask="true">
    <Header />
    <Suspense fallback={null}><StickyMobileCTA /></Suspense>
    <ScrollToTop />
    <main>
      <Hero />
      <TrustBar />
      <Suspense fallback={<Placeholder height="500px" />}>
        <InAction />
      </Suspense>
      <Suspense fallback={<Placeholder />}>
        <ShopifyProducts />
      </Suspense>
      <Suspense fallback={<Placeholder />}>
        <Benefits />
      </Suspense>
      <Suspense fallback={<Placeholder />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<Placeholder height="600px" />}>
        <ComparisonSlider />
      </Suspense>
      <Suspense fallback={<Placeholder height="200px" />}>
        <CtaBridge />
      </Suspense>
      <Suspense fallback={<Placeholder height="300px" />}>
        <FAQ />
      </Suspense>
    </main>
    <Suspense fallback={<Placeholder height="300px" />}>
      <Footer />
    </Suspense>
    <Suspense fallback={null}>
      <SocialProofToasts />
      <InactivityPopup />
    </Suspense>
  </div>
);

export default Index;

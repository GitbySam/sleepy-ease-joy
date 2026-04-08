import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import SocialProofToasts from "@/components/SocialProofToasts";
import InactivityPopup from "@/components/InactivityPopup";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import ScrollToTop from "@/components/ScrollToTop";

const InAction = lazy(() => import("@/components/InAction"));
const ComparisonSlider = lazy(() => import("@/components/ComparisonSlider"));
const ShopifyProducts = lazy(() => import("@/components/ShopifyProducts"));
const Benefits = lazy(() => import("@/components/Benefits"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const CtaBridge = lazy(() => import("@/components/CtaBridge"));
const BundleOffer = lazy(() => import("@/components/BundleOffer"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => (
  <>
    <Header />
    <SocialProofToasts />
    <InactivityPopup />
    <StickyMobileCTA />
    <ScrollToTop />
    <main>
      <Hero />
      <TrustBar />
      <Suspense fallback={<div style={{ minHeight: '4000px' }} />}>
        <ComparisonSlider />
        <InAction />
        <ShopifyProducts />
        <Benefits />
        <Testimonials />
        <CtaBridge />
        <BundleOffer />
        <FAQ />
      </Suspense>
    </main>
    <Suspense fallback={null}>
      <Footer />
    </Suspense>
  </>
);

export default Index;

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { trackPageView } from "./lib/metaPixel";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { MarketProvider } from "@/i18n/MarketContext";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
const Product = lazy(() => import("./pages/Product"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Returns = lazy(() => import("./pages/Returns"));
const Shipping = lazy(() => import("./pages/Shipping"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
import { useCartSync } from "./hooks/useCartSync";
import CheckoutRedirectOverlay from "./components/CheckoutRedirectOverlay";

const queryClient = new QueryClient();

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView();
  }, [location.pathname]);
  return null;
};

const CartSyncWrapper = () => {
  useCartSync();
  return null;
};

const AppRoutes = () => {
  return (
    <LanguageProvider>
      <MarketProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CartSyncWrapper />
          <CheckoutRedirectOverlay />
          <BrowserRouter>
            <RouteTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/product" element={<Suspense fallback={null}><Product /></Suspense>} />
              <Route path="/product/:handle" element={<Suspense fallback={null}><Product /></Suspense>} />
              <Route path="/terms" element={<Suspense fallback={null}><Terms /></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={null}><Privacy /></Suspense>} />
              <Route path="/returns" element={<Suspense fallback={null}><Returns /></Suspense>} />
              <Route path="/shipping" element={<Suspense fallback={null}><Shipping /></Suspense>} />
              <Route path="/admin/analytics" element={<Suspense fallback={null}><AdminAnalytics /></Suspense>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
      </MarketProvider>
    </LanguageProvider>
  );
};

export default AppRoutes;

import { useEffect, useState } from "react";
import cartTrustBadges from "@/assets/cart-trust-badges.jpg";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Loader2, ShieldCheck, Truck, RotateCcw, Lock, Star, CheckCircle, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useLanguage } from "@/i18n/LanguageContext";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitorId";
import pillowGrey from "@/assets/product-pillow-grey-new.webp";
import pillowBlack from "@/assets/product-pillow-black.webp";
import pillowRed from "@/assets/product-pillow-red.webp";

const COLOR_IMAGES: Record<string, string> = {
  Grey: pillowGrey,
  Gray: pillowGrey,
  Black: pillowBlack,
  Red: pillowRed,
};


const TESTIMONIAL_KEYS = ["cart.testimonial1", "cart.testimonial2", "cart.testimonial3"] as const;

export const ShopifyCartDrawer = () => {
  const { items, isLoading, isSyncing, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const { t } = useLanguage();
  const totalItems = items.length;
  const totalPrice = items.reduce((sum, item) => sum + (item.bundlePrice ? item.bundlePrice : parseFloat(item.price.amount) * item.quantity), 0);

  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    if (isDrawerOpen && !isLoading) {
      const timeout = setTimeout(() => syncCart(), 500);
      return () => clearTimeout(timeout);
    }
  }, [isDrawerOpen, isLoading, syncCart]);

  useEffect(() => {
    if (!isDrawerOpen || items.length === 0) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIAL_KEYS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isDrawerOpen, items.length]);

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      trackInitiateCheckout({
        value: totalPrice,
        numItems: totalItems,
      });
      // Track checkout initiation in Supabase (fire-and-forget)
      try {
        const url = new URL(checkoutUrl);
        const discountCode = url.searchParams.get('discount') || null;
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const source = path.startsWith('/product') ? 'product' : path === '/' || path === '' ? 'landing' : 'other';
        supabase.from('checkout_events').insert([{
          total_items: items.reduce((sum, i) => sum + i.quantity, 0),
          total_price: Math.round(totalPrice * 100) / 100,
          currency: items[0]?.price?.currencyCode || 'USD',
          bundle_labels: items.map(i => i.bundleLabel || 'single'),
          variant_ids: items.map(i => i.variantId),
          discount_code: discountCode,
          source,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          visitor_id: getVisitorId(),
        }]).then();
      } catch (e) {
        console.error('Failed to log checkout event', e);
      }
      let finalUrl = checkoutUrl;
      try {
        const u = new URL(checkoutUrl);
        if (u.hostname.endsWith('.myshopify.com')) {
          u.hostname = 'checkout.sleepenzy.com';
          finalUrl = u.toString();
        }
      } catch {}
      window.open(finalUrl, '_blank');
      setDrawerOpen(false);
    }
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <ShoppingCart className="h-5 w-5 text-foreground" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-gold text-primary-foreground border-0">
              {totalItems}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-serif-display">{t("cart.title")}</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? t("cart.empty") : `${totalItems} ${t("cart.items")}`}
          </SheetDescription>
        </SheetHeader>

        {/* Trust badges image */}
        <div className="flex-shrink-0 pt-3">
          <img src={cartTrustBadges} alt="Secure Payments · Free Shipping · 30 Days Satisfied or Refunded · Customer Service 7/7" className="w-full rounded-lg" />
        </div>

        {/* Trust banner + social proof */}
        {items.length > 0 && (
          <div className="flex-shrink-0 space-y-2 pt-2">
            <div className="flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground">{t("cart.trustBanner")}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
              ))}
              <span className="text-xs font-medium text-muted-foreground ml-1">{t("cart.socialProof")}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 pt-4 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("cart.empty")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.variantId}__${item.bundleLabel || 'single'}`} className="flex gap-4 p-3 bg-muted/30 rounded-xl border border-border">
                      {(() => {
                        const colorOption = item.selectedOptions.find(o => o.name?.toLowerCase() === "color")?.value;
                        const colorImage = colorOption ? COLOR_IMAGES[colorOption] : undefined;
                        const fallback = item.product.node.images?.edges?.[0]?.node?.url;
                        const imgSrc = colorImage || fallback;
                        return (
                          <div className="w-16 h-16 bg-background rounded-md overflow-hidden flex-shrink-0 border border-border">
                            {imgSrc && (
                              <img src={imgSrc} alt={`${item.product.node.title}${colorOption ? ` - ${colorOption}` : ''}`} className="w-full h-full object-cover" />
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate text-sm">{item.product.node.title}</h4>
                        {item.bundleLabel && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-gold/20 text-gold px-2 py-1 rounded-md mt-1">
                            {item.bundleLabel}
                            <span className="bg-gold text-primary-foreground px-1.5 py-0.5 rounded text-[11px] font-extrabold">
                              ×{item.bundleUnitSize ? Math.round(item.quantity / item.bundleUnitSize) : item.quantity}
                            </span>
                          </span>
                        )}
                        {!item.bundleLabel && item.quantity > 1 && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-1">
                            Qty: <span className="font-bold text-foreground">{item.quantity}</span>
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' • ')}</p>
                        <p className="text-xs text-muted-foreground">
                          + {item.quantity}× {t("cart.transportBag")}
                        </p>
                        <p className="font-semibold text-foreground mt-1">
                          ${item.bundlePrice ? item.bundlePrice.toFixed(2) : (parseFloat(item.price.amount) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button onClick={() => removeItem(item.variantId, item.bundleLabel)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {(() => {
                          const step = item.bundleUnitSize && item.bundleUnitSize > 0 ? item.bundleUnitSize : 1;
                          const packs = Math.max(1, Math.round(item.quantity / step));
                          const decrease = () => updateQuantity(item.variantId, Math.max(step, item.quantity - step), item.bundleLabel);
                          const increase = () => updateQuantity(item.variantId, item.quantity + step, item.bundleLabel);
                          return (
                            <div className="flex items-center gap-1 border border-border rounded-md bg-background">
                              <button
                                onClick={decrease}
                                disabled={isLoading || packs <= 1}
                                aria-label="Decrease quantity"
                                className="p-1.5 hover:bg-muted transition-colors rounded-l-md disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-semibold w-5 text-center text-foreground">{packs}</span>
                              <button
                                onClick={increase}
                                disabled={isLoading}
                                aria-label="Increase quantity"
                                className="p-1.5 hover:bg-muted transition-colors rounded-r-md disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Free shipping bar */}
                <div className="mt-4 bg-gold/10 border border-gold/20 rounded-lg px-3 py-2 text-center">
                  <div className="w-full bg-gold/20 rounded-full h-1.5 mb-1.5">
                    <div className="bg-gold h-1.5 rounded-full w-full" />
                  </div>
                  <span className="text-xs font-bold text-gold">{t("cart.freeShippingQualified")}</span>
                </div>
              </div>

              <div className="flex-shrink-0 space-y-4 pt-4 border-t border-border bg-background">
                {/* Rotating testimonial */}
                <div className="text-center py-2 bg-muted/40 rounded-lg px-3">
                  <p className="text-xs italic text-muted-foreground transition-opacity duration-500">
                    {t(TESTIMONIAL_KEYS[testimonialIndex])}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">{t("cart.total")}</span>
                  <span className="text-xl font-bold text-foreground">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button onClick={handleCheckout} className="w-full bg-gold hover:bg-gold/90 text-primary-foreground shadow-gold-glow" size="lg" disabled={items.length === 0 || isLoading || isSyncing}>
                  {isLoading || isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {t("cart.checkout")}
                    </>
                  )}
                </Button>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> {t("product.securePayment")}</span>
                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> {t("product.freeShipping")}</span>
                    <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> {t("product.guarantee90")}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#1A1F71"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">VISA</text></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#EB001B" opacity="0.15"/><circle cx="18" cy="16" r="10" fill="#EB001B"/><circle cx="30" cy="16" r="10" fill="#F79E1B"/><path d="M24 8.5a10 10 0 010 15 10 10 0 010-15z" fill="#FF5F00"/></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#016FD0"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Arial">AMEX</text></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#F5F5F5" stroke="#ddd" strokeWidth="0.5"/><text x="24" y="18" textAnchor="middle" fill="#3C4043" fontSize="7" fontWeight="bold" fontFamily="Arial">G Pay</text></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#F5F5F5" stroke="#ddd" strokeWidth="0.5"/><text x="24" y="19" textAnchor="middle" fill="#003087" fontSize="7" fontWeight="bold" fontFamily="Arial">PayPal</text></svg>
                  </div>
                  <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="w-3 h-3" /> {t("product.sslEncryption")}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShopifyCartDrawer;

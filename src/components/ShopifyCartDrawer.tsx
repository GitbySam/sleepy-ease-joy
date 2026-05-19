import { useEffect, useState } from "react";
import cartTrustBadges from "@/assets/cart-trust-badges.jpg";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Loader2, ShieldCheck, Truck, RotateCcw, Lock, Star, CheckCircle, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { trackFunnelStep, trackFriction } from "@/lib/funnelTracking";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitorId";
import pillowGrey from "@/assets/product-pillow-grey-new.webp";
import pillowBlack from "@/assets/product-pillow-black.webp";
import pillowRed from "@/assets/product-pillow-red.webp";
import sleepMaskImg from "@/assets/sleep-mask.png";

const COLOR_IMAGES: Record<string, string> = {
  Grey: pillowGrey,
  Gray: pillowGrey,
  Black: pillowBlack,
  Red: pillowRed,
};


const TESTIMONIAL_KEYS = ["cart.testimonial1", "cart.testimonial2", "cart.testimonial3"] as const;

export const ShopifyCartDrawer = () => {
  const { items, isLoading, isSyncing, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, addItem, getCheckoutUrl, syncCart } = useCartStore();
  const { t } = useLanguage();
  const { country, currency, formatPrice, prices } = useMarket();

  // Sleep Kit upsell — only when cart has a Sleep&zy pack (no Sleep Bundle)
  const PACK_LABELS = ["SOLO TRAVELERS", "DUO PACK", "FAMILY PACK"];
  const SLEEP_KIT_LABEL = "Sleep Kit";
  const SLEEP_KIT_MAX = 5;
  const kitPrice = prices.sleepKit;

  const hasSleepzyPack = items.some(
    (i) => i.bundleLabel !== SLEEP_KIT_LABEL && (!i.bundleLabel || PACK_LABELS.includes((i.bundleLabel || "").toUpperCase()))
  );
  const hasSleepBundle = items.some((i) => (i.bundleLabel || "").toLowerCase().includes("bundle"));
  const showSleepKit = hasSleepzyPack && !hasSleepBundle;

  const sleepKitItem = items.find((i) => i.bundleLabel === SLEEP_KIT_LABEL);
  const sleepKits = sleepKitItem?.quantity ?? 0;

  // Render items list without the Sleep Kit (it's shown via the upsell card)
  const displayItems = items.filter((i) => i.bundleLabel !== SLEEP_KIT_LABEL);
  const totalItems = displayItems.length + (sleepKits > 0 ? 1 : 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.bundlePrice ? item.bundlePrice : parseFloat(item.price.amount) * item.quantity),
    0
  );

  // Fetch Sleep Kit product (once per market) so we can add it as a real Shopify line
  const [sleepKitProduct, setSleepKitProduct] = useState<ShopifyProduct | null>(null);
  useEffect(() => {
    if (!showSleepKit || sleepKitProduct) return;
    let cancelled = false;
    fetchProducts(1, 'product_type:"Sleep Kit"', country)
      .then((res) => { if (!cancelled && res.length > 0) setSleepKitProduct(res[0]); })
      .catch((e) => console.error("Sleep Kit fetch error", e));
    return () => { cancelled = true; };
  }, [showSleepKit, sleepKitProduct, country]);

  const sleepKitVariant = sleepKitProduct?.node.variants.edges[0]?.node;

  const handleKitIncrease = async () => {
    if (!sleepKitProduct || !sleepKitVariant) return;
    if (sleepKits >= SLEEP_KIT_MAX) return;
    if (sleepKitItem) {
      await updateQuantity(sleepKitItem.variantId, sleepKits + 1, SLEEP_KIT_LABEL);
    } else {
      await addItem({
        product: sleepKitProduct,
        variantId: sleepKitVariant.id,
        variantTitle: sleepKitVariant.title,
        price: sleepKitVariant.price,
        quantity: 1,
        selectedOptions: sleepKitVariant.selectedOptions || [],
        bundleLabel: SLEEP_KIT_LABEL,
      }, country);
    }
  };

  const handleKitDecrease = async () => {
    if (!sleepKitItem) return;
    if (sleepKits <= 1) {
      await removeItem(sleepKitItem.variantId, SLEEP_KIT_LABEL);
    } else {
      await updateQuantity(sleepKitItem.variantId, sleepKits - 1, SLEEP_KIT_LABEL);
    }
  };

  const kitTotal = sleepKits * kitPrice;

  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    if (isDrawerOpen && !isLoading) {
      const timeout = setTimeout(() => syncCart(), 500);
      return () => clearTimeout(timeout);
    }
  }, [isDrawerOpen, isLoading, syncCart]);

  // Track when the cart drawer opens (separate effect to avoid double-fire)
  useEffect(() => {
    if (isDrawerOpen) {
      trackFunnelStep('open_cart', {
        value: totalPrice,
        currency,
        metadata: { items: totalItems },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen || items.length === 0) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIAL_KEYS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isDrawerOpen, items.length]);

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (!checkoutUrl) {
      trackFriction('checkout_error', {
        severity: 'error',
        message: 'No checkoutUrl available when user clicked checkout',
        metadata: { totalItems, totalPrice },
      });
      return;
    }
    // CRITICAL: open the popup SYNCHRONOUSLY at the very top of the click
    // handler, BEFORE any await/Supabase call. Otherwise mobile Safari /
    // Chrome will treat it as a programmatic popup and block it silently
    // (root cause of the "click checkout → nothing happens" abandon).
    let popup: Window | null = null;
    try {
      popup = window.open('about:blank', '_blank');
    } catch {}
    if (checkoutUrl) {
      trackFunnelStep('click_checkout', {
        value: totalPrice,
        currency,
        metadata: { items: totalItems },
      });
      trackInitiateCheckout({
        value: totalPrice,
        numItems: totalItems,
      });
      // Log the checkout event immediately on click. This is the source of
      // truth for "checkouts initiated". Display latency is captured
      // opportunistically below (desktop-only, best-effort) via a separate
      // UPDATE — it must NEVER block or replace this insert.
      let pendingId: string | null = null;
      try {
        const url = new URL(checkoutUrl);
        const discountCode = url.searchParams.get('discount') || null;
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const source = path.startsWith('/product') ? 'product' : path === '/' || path === '' ? 'landing' : 'other';
        const payload = {
          total_items: items.reduce((sum, i) => sum + i.quantity, 0),
          total_price: Math.round(totalPrice * 100) / 100,
          currency,
          bundle_labels: items.map(i => i.bundleLabel || 'single'),
          variant_ids: items.map(i => i.variantId),
          discount_code: discountCode,
          source,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          visitor_id: getVisitorId(),
        };
        supabase.from('checkout_events').insert([payload]).select('id').single().then(({ data, error }) => {
          if (error) {
            console.error('Failed to log checkout event', error);
            return;
          }
          if (data?.id) {
            pendingId = data.id;
            sessionStorage.setItem('pending_checkout_id', JSON.stringify({
              id: data.id,
              clickedAt: Date.now(),
            }));
          }
        });
      } catch (e) {
        console.error('Failed to prepare checkout event', e);
      }
      let finalUrl = checkoutUrl;
      try {
        const u = new URL(checkoutUrl);
        if (u.hostname.endsWith('.myshopify.com')) {
          u.hostname = 'checkout.sleepenzy.com';
          finalUrl = u.toString();
        }
      } catch {}
      if (popup && !popup.closed) {
        // Popup was successfully opened synchronously — just navigate it.
        try {
          popup.location.href = finalUrl;
        } catch {
          // Cross-origin lockdown shouldn't happen on about:blank, but fall
          // back to same-tab navigation just in case.
          window.location.href = finalUrl;
        }
      } else {
        // Popup blocked → log it and fall back to same-tab navigation so
        // the user is never stuck on a "nothing happened" click.
        trackFriction('checkout_error', {
          severity: 'warn',
          message: 'Popup blocked on checkout — falling back to same-tab navigation',
          metadata: { totalItems, totalPrice },
        });
        window.location.href = finalUrl;
      }
      try { sessionStorage.setItem('sleepzy_checked_out_at', String(Date.now())); } catch {}
      setDrawerOpen(false);
    }
  };

  // OPPORTUNISTIC: when the Shopify checkout tab takes focus (this tab goes
  // hidden), update the just-inserted row with displayed=true and the latency.
  // Best-effort only — works mostly on desktop. We never mark displayed=false
  // (that would pollute data on mobile where this listener rarely fires).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      const raw = sessionStorage.getItem('pending_checkout_id');
      if (!raw) return;
      try {
        const { id, clickedAt } = JSON.parse(raw) as { id: string; clickedAt: number };
        const latency = Math.max(0, Date.now() - clickedAt);
        sessionStorage.removeItem('pending_checkout_id');
        // Fire-and-forget update; page may unload before it completes (that's fine).
        supabase.from('checkout_events')
          .update({ displayed: true, display_latency_ms: latency })
          .eq('id', id)
          .then();
      } catch (e) {
        console.error('Failed to record checkout display latency', e);
      }
    };

    // Track when the user comes BACK to our tab after checkout — strong
    // signal of "abandoned checkout if no purchase happened on Shopify side"
    const onReturn = () => {
      if (document.visibilityState !== 'visible') return;
      const checkedOut = sessionStorage.getItem('sleepzy_checked_out_at');
      if (!checkedOut) return;
      const elapsed = Date.now() - Number(checkedOut);
      sessionStorage.removeItem('sleepzy_checked_out_at');
      trackFunnelStep('return_from_checkout', {
        metadata: { elapsedMs: elapsed },
      });
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('visibilitychange', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, []);

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <ShoppingCart className="h-5 w-5 text-foreground" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-numeric-safe font-bold bg-gold text-primary-foreground border-0">
              {totalItems}
            </Badge>
          )}
        </button>
      </SheetTrigger>
      <SheetContent data-clarity-unmask="true" className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-serif-display">{t("cart.title")}</SheetTitle>
            <SheetDescription className="font-numeric-safe text-sm tracking-normal">
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
              <span className="font-numeric-safe text-[13px] leading-snug font-semibold text-foreground tracking-normal">{t("cart.trustBanner")}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
              ))}
              <span className="font-numeric-safe text-[13px] font-medium text-muted-foreground ml-1 tracking-normal">{t("cart.socialProof")}</span>
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
                  {displayItems.map((item) => (
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
                            <span className="bg-gold text-primary-foreground px-1.5 py-0.5 rounded text-xs font-numeric-safe font-extrabold tracking-normal">
                              ×{item.bundleUnitSize ? Math.round(item.quantity / item.bundleUnitSize) : item.quantity}
                            </span>
                          </span>
                        )}
                        {!item.bundleLabel && item.quantity > 1 && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-1">
                            Qty: <span className="font-numeric-safe font-bold text-foreground tracking-normal">{item.quantity}</span>
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' • ')}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-numeric-safe tracking-normal">+ {item.quantity}×</span> {t("cart.transportBag")}
                        </p>
                        <p className="font-numeric-safe text-[15px] font-semibold text-foreground mt-1 tracking-normal">
                          {formatPrice(item.bundlePrice ? item.bundlePrice : parseFloat(item.price.amount) * item.quantity)}
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
                              <span className="font-numeric-safe text-sm font-semibold w-5 text-center text-foreground tracking-normal">{packs}</span>
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

                {/* Sleep Kit upsell — only when cart has Sleep&zy pack(s), not Sleep Bundle */}
                {showSleepKit && (
                  <div className="mt-4 rounded-xl border-2 border-dashed border-gold/40 bg-gold/5 p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-gold text-base leading-none">✨</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
                          {t("product.sleepKit.title")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("product.sleepKit.subtitle")} ({formatPrice(kitPrice)} {t("product.sleepKit.each")})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-card rounded-lg p-2.5 border border-border">
                      <div className="w-14 h-14 rounded-md bg-muted/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={sleepMaskImg} alt="Sleep Kit" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{t("product.sleepKit.name")}</p>
                        <p className="text-xs text-muted-foreground font-numeric-safe tracking-normal">
                          {sleepKits > 0 ? `+ ${formatPrice(kitTotal)}` : formatPrice(kitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 border border-border rounded-full bg-background">
                        <button
                          type="button"
                          onClick={handleKitDecrease}
                          disabled={sleepKits === 0 || isLoading}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
                          aria-label="Decrease Sleep Kit"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-numeric-safe text-sm font-bold w-5 text-center tracking-normal">{sleepKits}</span>
                        <button
                          type="button"
                          onClick={handleKitIncrease}
                          disabled={sleepKits >= SLEEP_KIT_MAX || isLoading || !sleepKitVariant}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
                          aria-label="Increase Sleep Kit"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {sleepKits >= SLEEP_KIT_MAX && (
                      <p className="text-xs font-semibold text-gold text-center">
                        ⭐ {t("product.sleepKit.maxReached")}
                      </p>
                    )}
                  </div>
                )}
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
                  <span className="font-numeric-safe text-xl font-bold text-foreground tracking-normal">
                    {formatPrice(totalPrice)}
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
                  <div className="font-numeric-safe flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground tracking-normal">
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
                  <p className="font-numeric-safe flex items-center justify-center gap-1 text-xs text-muted-foreground tracking-normal">
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

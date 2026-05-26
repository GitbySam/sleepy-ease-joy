import { useEffect, useState } from "react";
import cartTrustBadges from "@/assets/cart-trust-badges.jpg";
import paymentBadges from "@/assets/payment-badges.jpeg";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Loader2, ShieldCheck, Truck, RotateCcw, Lock, Star, CheckCircle, Minus, Plus, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { fetchProducts, formatCheckoutUrl, type ShopifyProduct } from "@/lib/shopify";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMarket } from "@/i18n/MarketContext";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { trackFunnelStep, trackFriction } from "@/lib/funnelTracking";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/visitorId";
import { getAttributionFields } from "@/lib/attribution";
import pillowGrey from "@/assets/product-pillow-grey-new.webp";
import pillowBlack from "@/assets/product-pillow-black.webp";
import pillowRed from "@/assets/product-pillow-red.webp";
import sleepMaskImg from "@/assets/sleep-kit-bundle.jpg";
import bundleGreyImg from "@/assets/bundle-three-items-hero.jpg";
import bundleRedImg from "@/assets/bundle-three-items-red.jpg";
import bundleBlackImg from "@/assets/bundle-three-items-black.jpg";

const COLOR_IMAGES: Record<string, string> = {
  Grey: pillowGrey,
  Gray: pillowGrey,
  Black: pillowBlack,
  Red: pillowRed,
};

const BUNDLE_COLOR_IMAGES: Record<string, string> = {
  grey: bundleGreyImg,
  gray: bundleGreyImg,
  black: bundleBlackImg,
  red: bundleRedImg,
};


const TESTIMONIAL_KEYS = ["cart.testimonial1", "cart.testimonial2", "cart.testimonial3"] as const;

export const ShopifyCartDrawer = () => {
  const { items, isLoading, isSyncing, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, addItem, getCheckoutUrl, syncCart, setRedirecting } = useCartStore();
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

  const sleepKitItem = items.find((i) => i.bundleLabel === SLEEP_KIT_LABEL);
  const sleepKits = sleepKitItem?.quantity ?? 0;

  // Show the Sleep Kit upsell card whenever the cart is eligible (has a single pack
  // without a bundle) OR when the kit is already in the cart — so adding a bundle
  // afterwards never makes a previously-added Sleep Kit disappear from the drawer.
  const showSleepKit = (hasSleepzyPack && !hasSleepBundle) || sleepKits > 0;

  // Render items list without the Sleep Kit (it's shown via the upsell card)
  const displayItems = items.filter((i) => i.bundleLabel !== SLEEP_KIT_LABEL);
  const totalItems = displayItems.length + (sleepKits > 0 ? 1 : 0);
  const totalPrice = displayItems.reduce(
    (sum, item) => sum + (item.bundlePrice ? item.bundlePrice : parseFloat(item.price.amount) * item.quantity),
    0
  ) + sleepKits * kitPrice;

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
    // Dedupe rapid double-clicks (< 1.5s) so they don't inflate metrics.
    const now = Date.now();
    const w = window as unknown as { __lastCheckoutClick?: number };
    if (w.__lastCheckoutClick && now - w.__lastCheckoutClick < 1500) {
      return;
    }
    w.__lastCheckoutClick = now;

    // Detect in-app browsers (Instagram, TikTok, Facebook, Snapchat, Line,
    // Messenger) — these often report popup-blocked even when the new tab
    // actually opens. We log it as metadata so we can disambiguate later.
    const ua = navigator.userAgent || '';
    const inAppBrowser =
      /Instagram|FBAN|FBAV|FB_IAB|Messenger|TikTok|musical_ly|Snapchat|Line\//i.test(ua)
        ? ua.match(/Instagram|FBAN|FBAV|FB_IAB|Messenger|TikTok|musical_ly|Snapchat|Line\//i)?.[0] ?? 'unknown'
        : null;

    const clickTs = Date.now();
    // CRITICAL: open the popup SYNCHRONOUSLY at the very top of the click
    // handler, BEFORE any await/Supabase call. Otherwise mobile Safari /
    // Chrome will treat it as a programmatic popup and block it silently
    // (root cause of the "click checkout → nothing happens" abandon).
    let popup: Window | null = null;
    try {
      popup = window.open('about:blank', '_blank');
    } catch {}
    const popupOpened = !!(popup && !popup.closed);
    const latencyMs = Date.now() - clickTs;
    if (checkoutUrl) {
      trackFunnelStep('click_checkout', {
        value: totalPrice,
        currency,
        metadata: { items: totalItems, inAppBrowser },
        beacon: true,
      });
      trackFunnelStep(popupOpened ? 'checkout_opened' : 'checkout_popup_blocked', {
        value: totalPrice,
        currency,
        metadata: {
          items: totalItems,
          latencyMs,
          mode: popupOpened ? 'new_tab' : 'same_tab_fallback',
          inAppBrowser,
        },
        beacon: true,
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
          ...getAttributionFields(),
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
      const finalUrl = formatCheckoutUrl(checkoutUrl);
      // Show fullscreen redirect overlay so the user knows something is happening
      setRedirecting(true);
      if (popupOpened) {
        // Popup was successfully opened synchronously — just navigate it.
        try {
          popup!.location.href = finalUrl;
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
      <SheetContent data-clarity-unmask="true" className="w-full sm:max-w-lg flex flex-col h-full p-0 bg-cream">
        <SheetHeader className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-border/60">
          <SheetTitle className="text-2xl text-foreground">
            {t("cart.title")} <span className="font-numeric-safe text-foreground/80">({totalItems})</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            {totalItems === 0 ? t("cart.empty") : `${totalItems} ${t("cart.items")}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("cart.empty")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 pt-4 pb-3 min-h-0">
                <div className="space-y-3">
                  {displayItems.map((item) => (
                    <div key={`${item.variantId}__${item.bundleLabel || 'single'}`} className="relative flex gap-3 p-3 bg-cream-light rounded-2xl">
                      {(() => {
                        const isBundle = (item.bundleLabel || "").toLowerCase().includes("bundle");
                        const colorOption = item.selectedOptions.find(o => o.name?.toLowerCase() === "color")?.value;
                        const colorKey = (colorOption || "").toLowerCase();
                        let colorImage: string | undefined;
                        if (isBundle) {
                          colorImage = BUNDLE_COLOR_IMAGES[colorKey] || bundleGreyImg;
                        } else if (colorOption) {
                          colorImage = COLOR_IMAGES[colorOption] || COLOR_IMAGES[colorOption.charAt(0).toUpperCase() + colorOption.slice(1).toLowerCase()];
                        }
                        const fallback = item.product.node.images?.edges?.[0]?.node?.url;
                        const imgSrc = colorImage || fallback;
                        return (
                          <div className="w-20 h-20 bg-background rounded-xl overflow-hidden flex-shrink-0">
                            {imgSrc && (
                              <img src={imgSrc} alt={`${item.product.node.title}${colorOption ? ` - ${colorOption}` : ''}`} className="w-full h-full object-cover" />
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-[15px] leading-tight text-foreground truncate">
                          {item.product.node.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.bundleLabel
                            ? `${item.bundleLabel} · ${item.selectedOptions.map(o => o.value).join(' · ')}`
                            : item.selectedOptions.map(o => o.value).join(' · ')}
                        </p>
                        {(() => {
                          const step = item.bundleUnitSize && item.bundleUnitSize > 0 ? item.bundleUnitSize : 1;
                          const packs = Math.max(1, Math.round(item.quantity / step));
                          const decrease = () => updateQuantity(item.variantId, Math.max(step, item.quantity - step), item.bundleLabel);
                          const increase = () => updateQuantity(item.variantId, item.quantity + step, item.bundleLabel);
                          return (
                            <div className="mt-2 inline-flex items-center gap-3 bg-background rounded-full pl-2 pr-2 py-1 shadow-sm">
                              <button
                                onClick={decrease}
                                disabled={isLoading || packs <= 1}
                                aria-label="Decrease quantity"
                                className="w-6 h-6 flex items-center justify-center rounded-full text-foreground disabled:opacity-30"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="font-numeric-safe text-sm font-semibold w-4 text-center text-foreground tracking-normal">{packs}</span>
                              <button
                                onClick={increase}
                                disabled={isLoading}
                                aria-label="Increase quantity"
                                className="w-6 h-6 flex items-center justify-center rounded-full text-foreground disabled:opacity-30"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col items-end justify-between flex-shrink-0">
                        <button
                          onClick={() => removeItem(item.variantId, item.bundleLabel)}
                          aria-label="Remove item"
                          className="text-muted-foreground/70 hover:text-destructive transition-colors -mr-1 -mt-1 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-base text-foreground tracking-normal">
                          {formatPrice(item.bundlePrice ? item.bundlePrice : parseFloat(item.price.amount) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sleep Kit upsell — only when cart has Sleep&zy pack(s), not Sleep Bundle */}
                {showSleepKit && (
                  <div className="mt-4 rounded-2xl border border-dashed border-gold/50 bg-gold/5 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gold">✨</span>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
                        {t("product.sleepKit.title")}
                      </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="w-20 h-20 rounded-xl bg-background overflow-hidden flex-shrink-0">
                        <img src={sleepMaskImg} alt="Sleep Kit" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] leading-tight text-foreground truncate">
                          {t("product.sleepKit.name")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {t("product.sleepKit.subtitle")}
                        </p>
                        <div className="mt-2 inline-flex items-center gap-3 bg-background rounded-full pl-2 pr-2 py-1 shadow-sm">
                          <button
                            type="button"
                            onClick={handleKitDecrease}
                            disabled={sleepKits === 0 || isLoading}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-foreground disabled:opacity-30"
                            aria-label="Decrease Sleep Kit"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="font-numeric-safe text-sm font-semibold w-4 text-center tracking-normal">{sleepKits}</span>
                          <button
                            type="button"
                            onClick={handleKitIncrease}
                            disabled={sleepKits >= SLEEP_KIT_MAX || isLoading || !sleepKitVariant}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-foreground disabled:opacity-30"
                            aria-label="Increase Sleep Kit"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-base text-foreground self-end">
                        {sleepKits > 0 ? formatPrice(kitTotal) : formatPrice(kitPrice)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 px-5 pt-4 pb-5 border-t border-border/60 bg-cream space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl text-foreground">{t("cart.total")}</span>
                  <span className="text-2xl text-foreground tracking-normal">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  <Truck className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  {t("cart.freeShippingQualified")}
                </p>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-dark hover:bg-dark/90 text-primary-foreground rounded-full h-12 text-base"
                  size="lg"
                  disabled={items.length === 0 || isLoading || isSyncing}
                >
                  {isLoading || isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {t("cart.checkout")}
                    </>
                  )}
                </Button>

                <div className="rounded-xl bg-background/70 border border-border/60 px-3 py-2 text-center">
                  <p className="text-xs text-foreground/80">
                    {t("product.shopifyRedirect")}
                  </p>
                  <div className="font-numeric-safe mt-1 flex items-center justify-center gap-3 text-[11px] text-muted-foreground tracking-normal">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" />SSL</span>
                    <span className="inline-flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-600" />3D Secure</span>
                    <span className="inline-flex items-center gap-1"><RotateCcw className="w-3 h-3 text-emerald-600" />{t("product.guarantee90")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                    <img src={paymentBadges} alt="Visa, Mastercard, Apple Pay, Google Pay, PayPal, Shop Pay" className="h-7 w-auto" loading="lazy" />
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

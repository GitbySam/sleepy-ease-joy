import { useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, ShieldCheck, Truck, RotateCcw, Lock } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

export const ShopifyCartDrawer = () => {
  const { items, isLoading, isSyncing, isDrawerOpen, setDrawerOpen, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.bundlePrice ? item.bundlePrice : parseFloat(item.price.amount) * item.quantity), 0);

  useEffect(() => {
    if (isDrawerOpen) syncCart();
  }, [isDrawerOpen, syncCart]);

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
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
          <SheetTitle className="font-serif-display">Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.variantId}__${item.bundleLabel || 'single'}`} className="flex gap-4 p-3 bg-muted/30 rounded-xl border border-border">
                      <div className="w-16 h-16 bg-background rounded-md overflow-hidden flex-shrink-0">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img src={item.product.node.images.edges[0].node.url} alt={item.product.node.title} className="w-full h-full object-cover" />
                        )}
                      </div>
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
                        <p className="font-semibold text-foreground mt-1">
                          ${item.bundlePrice ? item.bundlePrice.toFixed(2) : (parseFloat(item.price.amount) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button onClick={() => removeItem(item.variantId, item.bundleLabel)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 space-y-4 pt-4 border-t border-border bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button onClick={handleCheckout} className="w-full bg-gold hover:bg-gold/90 text-primary-foreground shadow-gold-glow" size="lg" disabled={items.length === 0 || isLoading || isSyncing}>
                  {isLoading || isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Secure Checkout
                    </>
                  )}
                </Button>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Secure payment</span>
                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Free shipping</span>
                    <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> 90-day guarantee</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#1A1F71"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold" fontFamily="Arial">VISA</text></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#EB001B" opacity="0.15"/><circle cx="18" cy="16" r="10" fill="#EB001B"/><circle cx="30" cy="16" r="10" fill="#F79E1B"/><path d="M24 8.5a10 10 0 010 15 10 10 0 010-15z" fill="#FF5F00"/></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#016FD0"/><text x="24" y="20" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="Arial">AMEX</text></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#F5F5F5" stroke="#ddd" strokeWidth="0.5"/><text x="24" y="18" textAnchor="middle" fill="#3C4043" fontSize="7" fontWeight="bold" fontFamily="Arial">G Pay</text></svg>
                    <svg viewBox="0 0 48 32" className="h-6 w-auto"><rect width="48" height="32" rx="4" fill="#F5F5F5" stroke="#ddd" strokeWidth="0.5"/><text x="24" y="19" textAnchor="middle" fill="#003087" fontSize="7" fontWeight="bold" fontFamily="Arial">PayPal</text></svg>
                  </div>
                  <p className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                    <Lock className="w-3 h-3" /> Secure checkout with SSL encryption
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

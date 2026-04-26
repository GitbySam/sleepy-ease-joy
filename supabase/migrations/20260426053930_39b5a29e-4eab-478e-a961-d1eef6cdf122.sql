ALTER TABLE public.cart_events ADD COLUMN IF NOT EXISTS visitor_id text;
ALTER TABLE public.checkout_events ADD COLUMN IF NOT EXISTS visitor_id text;
CREATE INDEX IF NOT EXISTS idx_cart_events_visitor_id ON public.cart_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_checkout_events_visitor_id ON public.checkout_events(visitor_id);
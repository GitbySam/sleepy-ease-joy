ALTER TABLE public.funnel_events
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS landing_page text;

ALTER TABLE public.cart_events
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS landing_page text;

ALTER TABLE public.checkout_events
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS landing_page text;

CREATE INDEX IF NOT EXISTS idx_funnel_events_utm_campaign ON public.funnel_events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_funnel_events_utm_source ON public.funnel_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_cart_events_utm_campaign ON public.cart_events(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_checkout_events_utm_campaign ON public.checkout_events(utm_campaign);
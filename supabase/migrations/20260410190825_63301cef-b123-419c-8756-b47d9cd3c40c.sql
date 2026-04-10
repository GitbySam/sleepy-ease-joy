
CREATE TABLE public.cart_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id TEXT NOT NULL,
  bundle_label TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cart_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public tracking)
CREATE POLICY "Anyone can insert cart events"
ON public.cart_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated users can read cart events"
ON public.cart_events
FOR SELECT
TO authenticated
USING (true);

-- Index for date-based queries
CREATE INDEX idx_cart_events_created_at ON public.cart_events (created_at DESC);

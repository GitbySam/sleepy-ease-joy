CREATE TABLE public.checkout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_items integer NOT NULL DEFAULT 0,
  total_price numeric,
  currency text DEFAULT 'USD',
  bundle_labels text[],
  variant_ids text[],
  discount_code text,
  source text,
  user_agent text,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert checkout events"
  ON public.checkout_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read checkout events"
  ON public.checkout_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_checkout_events_created_at ON public.checkout_events(created_at DESC);
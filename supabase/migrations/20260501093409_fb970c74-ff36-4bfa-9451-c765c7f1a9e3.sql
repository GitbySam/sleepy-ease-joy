
-- ============================================
-- FUNNEL EVENTS — track every step of the purchase journey
-- ============================================
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  step TEXT NOT NULL,
  -- session_landing | view_product | select_color | select_bundle |
  -- add_to_cart | open_cart | click_checkout | return_from_checkout
  step_value TEXT,                  -- e.g. variant id, color, bundle label
  page_path TEXT,
  referrer TEXT,
  market TEXT,                      -- CA | US | FR
  language TEXT,                    -- en | fr | es
  currency TEXT,
  value NUMERIC,                    -- monetary value associated with step (e.g. cart total)
  device TEXT,                      -- mobile | tablet | desktop
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert funnel events"
  ON public.funnel_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read funnel events"
  ON public.funnel_events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_funnel_events_created_at ON public.funnel_events (created_at DESC);
CREATE INDEX idx_funnel_events_visitor ON public.funnel_events (visitor_id, created_at DESC);
CREATE INDEX idx_funnel_events_step ON public.funnel_events (step, created_at DESC);

-- ============================================
-- FRICTION EVENTS — capture frustration signals & errors
-- ============================================
CREATE TABLE public.friction_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  type TEXT NOT NULL,
  -- rage_click | dead_click | js_error | shopify_error | product_load_error |
  -- checkout_error | slow_response | hesitation_abandon
  severity TEXT NOT NULL DEFAULT 'info', -- info | warn | error
  message TEXT,
  element TEXT,                          -- selector or label of clicked element
  page_path TEXT,
  market TEXT,
  language TEXT,
  device TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.friction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert friction events"
  ON public.friction_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read friction events"
  ON public.friction_events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_friction_events_created_at ON public.friction_events (created_at DESC);
CREATE INDEX idx_friction_events_type ON public.friction_events (type, created_at DESC);
CREATE INDEX idx_friction_events_visitor ON public.friction_events (visitor_id, created_at DESC);

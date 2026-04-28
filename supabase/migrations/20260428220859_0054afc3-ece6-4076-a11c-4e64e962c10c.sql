ALTER TABLE public.checkout_events
  ADD COLUMN IF NOT EXISTS displayed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_latency_ms integer NULL;
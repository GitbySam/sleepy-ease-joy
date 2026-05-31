CREATE TABLE public.daily_ad_spend (
  date date PRIMARY KEY,
  amount_cad numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_ad_spend TO authenticated;
GRANT ALL ON public.daily_ad_spend TO service_role;

ALTER TABLE public.daily_ad_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ad spend"
  ON public.daily_ad_spend FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ad spend"
  ON public.daily_ad_spend FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ad spend"
  ON public.daily_ad_spend FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad spend"
  ON public.daily_ad_spend FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
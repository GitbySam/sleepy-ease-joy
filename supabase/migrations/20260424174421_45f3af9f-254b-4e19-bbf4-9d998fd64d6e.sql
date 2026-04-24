DROP POLICY IF EXISTS "Authenticated users can read cart events" ON public.cart_events;
DROP POLICY IF EXISTS "Authenticated users can read checkout events" ON public.checkout_events;

CREATE POLICY "Anyone can read cart events"
  ON public.cart_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read checkout events"
  ON public.checkout_events
  FOR SELECT
  TO anon, authenticated
  USING (true);
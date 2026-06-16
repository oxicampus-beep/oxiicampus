-- Public order tracking by phone + realtime on store orders
CREATE OR REPLACE FUNCTION public.track_orders_by_phone(p_phone TEXT)
RETURNS TABLE (
  order_id UUID,
  order_type TEXT,
  network TEXT,
  size_gb NUMERIC,
  price NUMERIC,
  status public.order_status,
  contact_phone TEXT,
  store_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digits TEXT;
BEGIN
  v_digits := regexp_replace(trim(coalesce(p_phone, '')), '\D', '', 'g');
  IF length(v_digits) < 10 THEN
    RAISE EXCEPTION 'Enter a valid 10-digit phone number';
  END IF;
  v_digits := right(v_digits, 10);

  RETURN QUERY
  SELECT
    d.id,
    'platform'::TEXT,
    d.network::TEXT,
    d.size_gb,
    d.price,
    d.status,
    d.recipient_phone,
    NULL::TEXT,
    d.created_at,
    d.updated_at
  FROM public.data_orders d
  WHERE right(regexp_replace(d.recipient_phone, '\D', '', 'g'), 10) = v_digits

  UNION ALL

  SELECT
    so.id,
    'store'::TEXT,
    coalesce(sp.network::TEXT, 'unknown'),
    coalesce(sp.size_gb, 0),
    so.price,
    so.status,
    so.customer_phone,
    s.name,
    so.created_at,
    so.created_at
  FROM public.store_orders so
  LEFT JOIN public.store_packages sp ON sp.id = so.package_id
  LEFT JOIN public.stores s ON s.user_id = so.store_owner_id
  WHERE right(regexp_replace(so.customer_phone, '\D', '', 'g'), 10) = v_digits

  ORDER BY created_at DESC
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_orders_by_phone(TEXT) TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'store_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_orders;
  END IF;
END $$;

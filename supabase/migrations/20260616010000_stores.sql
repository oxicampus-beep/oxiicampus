-- Reseller mini-stores
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stores TO anon, authenticated;
GRANT INSERT, UPDATE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public view active stores" ON public.stores
  FOR SELECT USING (active = true);

CREATE POLICY "owners view own store" ON public.stores
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "owners manage own store" ON public.stores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER stores_updated BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow customers (including anonymous) to place store orders
GRANT INSERT ON public.store_orders TO anon;
GRANT SELECT ON public.store_packages TO anon;

CREATE POLICY "customers insert store orders" ON public.store_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.user_id = store_owner_id AND s.active = true)
    AND (
      package_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.store_packages sp
        WHERE sp.id = package_id AND sp.user_id = store_owner_id AND sp.active = true
      )
    )
  );

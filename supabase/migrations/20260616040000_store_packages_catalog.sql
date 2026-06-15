-- Admin packages: non-expiring validity by default
ALTER TABLE public.data_packages ALTER COLUMN validity SET DEFAULT 'Non expiry';
UPDATE public.data_packages SET validity = 'Non expiry';

-- Agent store packages link to admin catalog with base (agent) cost
ALTER TABLE public.store_packages
  ADD COLUMN IF NOT EXISTS data_package_id UUID REFERENCES public.data_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2);

CREATE UNIQUE INDEX IF NOT EXISTS store_packages_user_catalog_unique
  ON public.store_packages (user_id, data_package_id)
  WHERE data_package_id IS NOT NULL;

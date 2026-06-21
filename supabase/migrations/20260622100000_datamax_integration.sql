-- Datamax secondary data fulfillment provider
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS data_fulfillment_provider TEXT NOT NULL DEFAULT 'swiftdata'
    CHECK (data_fulfillment_provider IN ('swiftdata', 'datamax'));

COMMENT ON COLUMN public.platform_settings.data_fulfillment_provider IS
  'Active upstream API for data bundle fulfillment: swiftdata or datamax';

ALTER TABLE public.data_orders
  ADD COLUMN IF NOT EXISTS fulfillment_provider TEXT;

COMMENT ON COLUMN public.data_orders.fulfillment_provider IS
  'Upstream provider used when the order was fulfilled (swiftdata or datamax)';

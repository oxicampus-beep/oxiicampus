-- ============ DUAL PRICING: users vs agents (store owners) ============
ALTER TABLE public.data_packages RENAME COLUMN price TO user_price;
ALTER TABLE public.data_packages ADD COLUMN agent_price NUMERIC(10,2);
UPDATE public.data_packages SET agent_price = user_price WHERE agent_price IS NULL;
ALTER TABLE public.data_packages ALTER COLUMN agent_price SET NOT NULL;

-- ============ PLATFORM SETTINGS (singleton) ============
CREATE TABLE public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_activation_enabled BOOLEAN NOT NULL DEFAULT false,
  store_activation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id) VALUES (1);

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin update settings" ON public.platform_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ WALLET TOP-UP (atomic) ============
CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_new_bal NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = v_user_id
  RETURNING wallet_balance INTO v_new_bal;

  IF v_new_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (v_user_id, 'topup', p_amount, v_new_bal, 'Wallet top-up', 'success');

  RETURN v_new_bal;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_topup(NUMERIC) TO authenticated;

-- ============ PURCHASE DATA (atomic, server-side pricing) ============
CREATE OR REPLACE FUNCTION public.purchase_data_package(
  p_package_id UUID,
  p_recipient_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pkg public.data_packages%ROWTYPE;
  v_is_agent BOOLEAN;
  v_price NUMERIC;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_order_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_recipient_phone IS NULL OR length(trim(p_recipient_phone)) < 10 THEN
    RAISE EXCEPTION 'Invalid recipient phone';
  END IF;

  SELECT * INTO v_pkg FROM public.data_packages WHERE id = p_package_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package not found or inactive'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.stores WHERE user_id = v_user_id AND active = true
  ) INTO v_is_agent;

  v_price := CASE WHEN v_is_agent THEN v_pkg.agent_price ELSE v_pkg.user_price END;

  SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_bal < v_price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  v_new_bal := v_bal - v_price;
  UPDATE public.profiles SET wallet_balance = v_new_bal WHERE id = v_user_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (
    v_user_id, 'purchase', -v_price, v_new_bal,
    v_pkg.size_gb || 'GB ' || v_pkg.network::text || ' → ' || trim(p_recipient_phone),
    'success'
  );

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status
  ) VALUES (
    v_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, v_price, trim(p_recipient_phone), 'completed'
  ) RETURNING id INTO v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_data_package(UUID, TEXT) TO authenticated;

-- ============ CREATE STORE (optional activation fee) ============
CREATE OR REPLACE FUNCTION public.create_store(
  p_name TEXT,
  p_whatsapp TEXT,
  p_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_settings public.platform_settings%ROWTYPE;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_store_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN RAISE EXCEPTION 'Store name required'; END IF;
  IF p_whatsapp IS NULL OR trim(p_whatsapp) = '' THEN RAISE EXCEPTION 'WhatsApp number required'; END IF;
  IF p_slug IS NULL OR trim(p_slug) = '' THEN RAISE EXCEPTION 'Store slug required'; END IF;

  IF EXISTS(SELECT 1 FROM public.stores WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'You already have a store';
  END IF;

  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;

  IF v_settings.store_activation_enabled AND v_settings.store_activation_fee > 0 THEN
    SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
    IF v_bal < v_settings.store_activation_fee THEN
      RAISE EXCEPTION 'Insufficient wallet balance. Top up ₵% to activate your store.', v_settings.store_activation_fee;
    END IF;

    v_new_bal := v_bal - v_settings.store_activation_fee;
    UPDATE public.profiles SET wallet_balance = v_new_bal WHERE id = v_user_id;

    INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
    VALUES (
      v_user_id, 'purchase', -v_settings.store_activation_fee, v_new_bal,
      'Store activation fee', 'success'
    );
  END IF;

  INSERT INTO public.stores (user_id, name, whatsapp, slug)
  VALUES (v_user_id, trim(p_name), trim(p_whatsapp), trim(p_slug))
  RETURNING id INTO v_store_id;

  RETURN v_store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_store(TEXT, TEXT, TEXT) TO authenticated;

-- Helper: check if current user is an agent (has active store)
CREATE OR REPLACE FUNCTION public.is_agent(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.stores WHERE user_id = _user_id AND active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_agent(UUID) TO authenticated;

-- Admin can view all stores for user management
CREATE POLICY "admin view all stores" ON public.stores
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

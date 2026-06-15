-- Backfill profiles for auth users missing a row (e.g. signed up before trigger)
INSERT INTO public.profiles (id, full_name, phone, email)
SELECT
  u.id,
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'phone',
  u.email
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Ensure default user role for backfilled accounts
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'user'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'user'
);

-- Creates profile + role if missing (called before wallet/store operations)
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.profiles (id, full_name, phone, email)
  SELECT
    u.id,
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'phone',
    u.email
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

-- Wallet top-up: ensure profile exists first
CREATE OR REPLACE FUNCTION public.wallet_topup(p_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_new_bal NUMERIC;
BEGIN
  v_user_id := public.ensure_user_profile();

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

-- Purchase data: ensure profile exists first
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
  v_user_id UUID;
  v_pkg public.data_packages%ROWTYPE;
  v_is_agent BOOLEAN;
  v_price NUMERIC;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_order_id UUID;
BEGIN
  v_user_id := public.ensure_user_profile();

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

-- Create store: ensure profile exists first
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
  v_user_id UUID;
  v_settings public.platform_settings%ROWTYPE;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_store_id UUID;
BEGIN
  v_user_id := public.ensure_user_profile();

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

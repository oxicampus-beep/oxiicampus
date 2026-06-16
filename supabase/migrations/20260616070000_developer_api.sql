-- API purchases via ByteBoss developer API (service role / edge functions only)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.api_purchase_data_package(
  p_user_id UUID,
  p_package_id UUID,
  p_recipient_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg public.data_packages%ROWTYPE;
  v_is_agent BOOLEAN;
  v_price NUMERIC;
  v_bal NUMERIC;
  v_new_bal NUMERIC;
  v_order_id UUID;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'User id required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF p_recipient_phone IS NULL OR length(trim(p_recipient_phone)) < 10 THEN
    RAISE EXCEPTION 'Invalid recipient phone';
  END IF;

  SELECT * INTO v_pkg FROM public.data_packages WHERE id = p_package_id AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Package not found or inactive'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.stores WHERE user_id = p_user_id AND active = true
  ) INTO v_is_agent;

  v_price := CASE WHEN v_is_agent THEN v_pkg.agent_price ELSE v_pkg.user_price END;

  SELECT wallet_balance INTO v_bal FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_bal IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_bal < v_price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;

  v_new_bal := v_bal - v_price;
  UPDATE public.profiles SET wallet_balance = v_new_bal WHERE id = p_user_id;

  INSERT INTO public.transactions (user_id, type, amount, balance_after, description, status)
  VALUES (
    p_user_id, 'purchase', -v_price, v_new_bal,
    v_pkg.size_gb || 'GB ' || v_pkg.network::text || ' → ' || trim(p_recipient_phone),
    'success'
  );

  INSERT INTO public.data_orders (
    user_id, package_id, network, size_gb, price, recipient_phone, status
  ) VALUES (
    p_user_id, v_pkg.id, v_pkg.network, v_pkg.size_gb, v_price, trim(p_recipient_phone), 'processing'
  ) RETURNING id INTO v_order_id;

  UPDATE public.data_orders SET provider_reference = v_order_id::text WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.api_purchase_data_package(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.api_purchase_data_package(UUID, UUID, TEXT) TO service_role;
